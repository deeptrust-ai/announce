"""Extrude the original DeepTrust SVG mark to 12 inches wide and 1 inch deep.

Run in a separate Blender process:
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
    --python scripts/create-inner-truth.py

The SVG's cubic curves preserve its rounded outer corners. Only the white mark
paths are extruded; the navy background rectangle is excluded.
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector
from math import radians

ROOT = Path(__file__).resolve().parents[1]
INCH = 0.0254
WIDTH = 12 * INCH
DEPTH = INCH
SVG_PATH = ROOT / 'public' / 'branding' / 'logo-mark.svg'

if not bpy.app.background:
    raise RuntimeError('Run this generator in a separate background Blender process.')

def parse_path(path):
    """Read the M/L/H/V/C/Z SVG commands used by the original logo paths.

    Retain cubic Bezier control points instead of approximating rounded corners
    with straight edges. Unsupported commands fail explicitly.
    """
    tokens = re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', path)
    index = 0
    command = None
    points = []
    current = Vector((0, 0, 0))

    def number():
        nonlocal index
        value = float(tokens[index])
        index += 1
        return value

    def point(relative):
        value = Vector((number(), number(), 0))
        return current + value if relative else value

    def append(position, left=None):
        points.append({
            'co': position.copy(),
            'left': left.copy() if left is not None else position.copy(),
            'right': position.copy(),
        })

    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
        relative = command.islower()
        kind = command.upper()
        if kind == 'M':
            if points:
                raise ValueError('Each logo path must have one closed contour.')
            current = point(relative)
            append(current)
            command = 'l' if relative else 'L'
        elif kind == 'L':
            current = point(relative)
            append(current)
        elif kind == 'H':
            value = number()
            current = Vector((current.x + value if relative else value, current.y, 0))
            append(current)
        elif kind == 'V':
            value = number()
            current = Vector((current.x, current.y + value if relative else value, 0))
            append(current)
        elif kind == 'C':
            handle_right = point(relative)
            handle_left = point(relative)
            endpoint = point(relative)
            points[-1]['right'] = handle_right
            current = endpoint
            append(current, handle_left)
        elif kind == 'Z':
            if (points[-1]['co'] - points[0]['co']).length < 1e-6:
                points[0]['left'] = points.pop()['left']
            if index != len(tokens):
                raise ValueError('Unexpected data after closed logo path.')
            return points
        else:
            raise ValueError(f'Unsupported SVG command: {command}')
    raise ValueError('Logo paths must be closed.')

# This is the isolated factory-startup scene, not the user's open Blender file.
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene = bpy.context.scene
scene.name = 'DeepTrust logo mark'
scene.unit_settings.system = 'IMPERIAL'
scene.unit_settings.scale_length = 1
scene.unit_settings.length_unit = 'INCHES'

curve = bpy.data.curves.new('Original SVG logo outline', type='CURVE')
curve.dimensions = '2D'
curve.resolution_u = 24
curve.fill_mode = 'BOTH'
curve.extrude = 0.05
curve.bevel_depth = 0
svg = ET.parse(SVG_PATH).getroot()
for path in svg.findall('{http://www.w3.org/2000/svg}path'):
    if path.get('class') != 'st0':
        continue
    points = parse_path(path.attrib['d'])
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    spline.use_cyclic_u = True
    for target, source in zip(spline.bezier_points, points):
        # SVG Y points down; Blender's face coordinates point up.
        target.handle_left_type = 'FREE'
        target.handle_right_type = 'FREE'
        target.co = (source['co'].x, -source['co'].y, 0)
        target.handle_left = (source['left'].x, -source['left'].y, 0)
        target.handle_right = (source['right'].x, -source['right'].y, 0)

obj = bpy.data.objects.new('DeepTrust logo mark', curve)
scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.convert(target='MESH')
obj = bpy.context.object
bpy.context.view_layer.update()

# Retain the logo's original face proportions and curved outer corners.
face_scale = WIDTH / obj.dimensions.x
obj.scale = (face_scale, face_scale, DEPTH / obj.dimensions.z)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bounds = [Vector(corner) for corner in obj.bound_box]
center = (Vector(tuple(min(v[i] for v in bounds) for i in range(3)))
          + Vector(tuple(max(v[i] for v in bounds) for i in range(3)))) / 2
for vertex in obj.data.vertices:
    vertex.co -= center

# Stand upright: X is width, Y is extrusion depth, Z is height.
obj.rotation_euler.x = radians(90)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
mesh = bmesh.new()
mesh.from_mesh(obj.data)
bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=1e-7)
bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
mesh.to_mesh(obj.data)
mesh.free()
obj.data.update()
bpy.context.view_layer.update()
obj['character'] = '䷼'
obj['unicode'] = 'U+4DFC'
obj['width_inches'] = 12.0
obj['depth_inches'] = 1.0
obj['outline_source'] = 'public/branding/logo-mark.svg — original white paths'
obj['corner_style'] = 'Original SVG Bezier curves; no added bevel'

material = bpy.data.materials.new('Neutral satin')
material.diffuse_color = (0.65, 0.69, 0.72, 1)
material.use_nodes = True
shader = material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = material.diffuse_color
shader.inputs['Metallic'].default_value = 0.15
shader.inputs['Roughness'].default_value = 0.32
obj.data.materials.append(material)

# Export only the model. glTF converts the upright model to Y-up, facing +Z.
model_dir = ROOT / 'models'
web_dir = ROOT / 'public' / 'models'
model_dir.mkdir(parents=True, exist_ok=True)
web_dir.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(web_dir / 'inner-truth.glb'),
    export_format='GLB',
    use_selection=True,
    export_yup=True,
    export_animations=False,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
)

# Keep preview equipment separate from the model for editing and future exports.
studio = bpy.data.collections.new('Preview studio')
scene.collection.children.link(studio)

def point_at(item, target=(0, 0, 0)):
    item.rotation_euler = (Vector(target) - item.location).to_track_quat('-Z', 'Y').to_euler()

camera_data = bpy.data.cameras.new('Preview camera')
camera = bpy.data.objects.new('Preview camera', camera_data)
studio.objects.link(camera)
camera.location = (0.38, -0.9, 0.32)
point_at(camera)
camera_data.type = 'ORTHO'
camera_data.ortho_scale = max(obj.dimensions.x, obj.dimensions.z) * 1.5
camera_data.lens = 50
scene.camera = camera

for name, location, energy, size in [
    ('Key', (-0.4, -0.5, 0.7), 35, 0.6),
    ('Fill', (0.5, -0.3, 0.15), 12, 0.5),
    ('Rim', (0.1, 0.4, 0.4), 25, 0.4),
]:
    light_data = bpy.data.lights.new(name, type='AREA')
    light_data.energy = energy
    light_data.shape = 'DISK'
    light_data.size = size
    light = bpy.data.objects.new(name, light_data)
    studio.objects.link(light)
    light.location = location
    point_at(light)

scene.world = bpy.data.worlds.new('Preview world')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.025, 0.035, 0.05, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.4
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(model_dir / 'inner-truth-preview.png')

# Store a useful viewport and select only the logo when opening the file.
for item in bpy.context.selected_objects:
    item.select_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.region_3d.view_location = (0, 0, 0)
            space.region_3d.view_distance = 0.7
            space.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            space.clip_start = 0.001
            space.overlay.show_floor = False
            space.overlay.show_axis_x = False
            space.overlay.show_axis_y = False

# The saved mesh has no external file dependencies.
for unused_curve in list(bpy.data.curves):
    if unused_curve.users == 0:
        bpy.data.curves.remove(unused_curve)

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(model_dir / 'inner-truth.blend'))
print(json.dumps({
    'model': obj.name,
    'dimensions_inches': [round(value / INCH, 5) for value in obj.dimensions],
    'vertices': len(obj.data.vertices),
    'blend': str(model_dir / 'inner-truth.blend'),
    'glb': str(web_dir / 'inner-truth.glb'),
}))
bpy.ops.render.render(write_still=True)
