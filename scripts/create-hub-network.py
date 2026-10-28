"""Build the supplied hub diagram as separate, shallow floor-level meshes.

Run with Blender --background --factory-startup --python scripts/create-hub-network.py.
Blender uses meters internally. The hub is 48 inches across; nodes are 12 inches.
The diagram lies in XY with +Z up. GLB export converts it to Three.js Y-up.
"""

import json
from math import cos, sin, pi, radians
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
INCH = 0.0254
HUB_RADIUS = 24 * INCH
NODE_RADIUS = 48 * INCH
NODE_SIZE = 12 * INCH

if not bpy.app.background:
    raise RuntimeError('Run in a separate background Blender process.')
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene = bpy.context.scene
scene.name = 'Hub network floor'
scene.unit_settings.system = 'IMPERIAL'
scene.unit_settings.length_unit = 'INCHES'
scene.unit_settings.scale_length = 1
model_collection = bpy.data.collections.new('Hub Network')
scene.collection.children.link(model_collection)


def material(name, color, metallic=0, roughness=0.4, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    if emission:
        shader.inputs['Emission Color'].default_value = (*color, 1)
        shader.inputs['Emission Strength'].default_value = emission
    return mat


hub_mat = material('Hub — dark plum', (0.018, 0.012, 0.025), 0.25, 0.32)
node_mat = material('Nodes — dark copper', (0.19, 0.075, 0.032), 0.45, 0.36)
orange = material('Connections and icons — amber', (1, 0.37, 0.09), 0.3, 0.3, 0.6)
lime = material('Hub rim and ports — lime', (0.66, 1, 0.16), 0.1, 0.3, 1.8)
port_dark = material('Port sockets', (0.025, 0.04, 0.012), 0.1)
orbit_mat = material('Orbit rings — graphite', (0.06, 0.075, 0.078), 0.35, 0.6)


def link_object(obj, parent=None):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    model_collection.objects.link(obj)
    obj.parent = parent
    return obj


def group(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    model_collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.empty_display_size = INCH
    return obj


root = group('Hub_Network')
root['layout'] = 'Floor plane XY; Z up. GLB is converted to Y up.'
root['hub_diameter_inches'] = 48
root['node_width_inches'] = 12
root['node_orbit_radius_inches'] = 48
root['reference'] = 'models/references/hub-reference.png'
root['concept'] = 'Separate hub, nodes and links for an acquisition animation.'
hub = group('Central_Hub', root)
nodes = group('Outer_Nodes', root)
links = group('Radial_Connections', root)
orbits = group('Orbit_Rings', root)


def rounded_outline(width, height, radius, steps=12):
    points = []
    for cx, cy, start in [
        (width / 2 - radius, height / 2 - radius, 0),
        (-width / 2 + radius, height / 2 - radius, 90),
        (-width / 2 + radius, -height / 2 + radius, 180),
        (width / 2 - radius, -height / 2 + radius, 270),
    ]:
        for i in range(steps + 1):
            angle = radians(start + 90 * i / steps)
            points.append((cx + radius * cos(angle), cy + radius * sin(angle)))
    return points


def rounded_slab(name, width, height, radius, depth, bottom, mat, parent):
    outline = rounded_outline(width, height, radius)
    count = len(outline)
    vertices = [(x, y, bottom + z) for z in (0, depth) for x, y in outline]
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces += [(i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    model_collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(mat)
    for face in mesh.polygons[2:]:
        face.use_smooth = True
    return obj


def tube(name, points, radius, mat, parent, closed=False):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    curve.use_fill_caps = True
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for target, point in zip(spline.points, points):
        target.co = (*point, 1)
    spline.use_cyclic_u = closed
    obj = bpy.data.objects.new(name, curve)
    model_collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(mat)
    return obj


def ring(name, radius, thickness, z, mat, parent):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=192, minor_segments=8,
        major_radius=radius, minor_radius=thickness,
    )
    obj = link_object(bpy.context.object, parent)
    obj.name = name
    obj.location.z = z
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


bpy.ops.mesh.primitive_cylinder_add(vertices=192, radius=HUB_RADIUS, depth=INCH)
plate = link_object(bpy.context.object, hub)
plate.name = 'Hub_Plate'
plate.location.z = INCH / 2
plate.data.materials.append(hub_mat)
for face in plate.data.polygons:
    face.use_smooth = len(face.vertices) == 4
ring('Hub_Lime_Rim', HUB_RADIUS, 0.13 * INCH, INCH, lime, hub)
ring('Orbit_Inner', 36 * INCH, 0.045 * INCH, 0.055 * INCH, orbit_mat, orbits)
ring('Orbit_Outer', NODE_RADIUS, 0.045 * INCH, 0.055 * INCH, orbit_mat, orbits)

ICON_Z = 1.58 * INCH


def icon_line(name, points, parent, closed=False):
    return tube(name, [(x * INCH, y * INCH, ICON_Z) for x, y in points],
                0.075 * INCH, orange, parent, closed)


def icon_box(name, width, height, radius, parent, offset=(0, 0)):
    points = [(x + offset[0], y + offset[1]) for x, y in rounded_outline(width, height, radius, 8)]
    return icon_line(name, points, parent, True)


def icon_ellipse(name, rx, ry, parent, offset=(0, 0)):
    points = [(offset[0] + rx * cos(2 * pi * i / 64),
               offset[1] + ry * sin(2 * pi * i / 64)) for i in range(64)]
    return icon_line(name, points, parent, True)


def add_icon(kind, parent):
    if kind == 'Messages':
        icon_box('Messages_Back_Bubble', 4.8, 3.3, 0.45, parent, (-0.8, 0.8))
        icon_box('Messages_Front_Bubble', 4.8, 3.3, 0.45, parent, (0.8, -0.8))
        icon_line('Messages_Tail', [(1.5, -2.45), (2.4, -3.3), (2.4, -2.3)], parent)
    elif kind == 'Domains':
        icon_ellipse('Domains_Globe', 2.7, 2.7, parent)
        icon_ellipse('Domains_Meridian', 1.15, 2.7, parent)
        icon_ellipse('Domains_Latitude', 2.7, 1, parent)
        icon_line('Domains_Equator', [(-2.7, 0), (2.7, 0)], parent)
    elif kind == 'Email':
        icon_box('Email_Envelope', 5.4, 3.7, 0.35, parent)
        icon_line('Email_Flap', [(-2.5, 1.65), (0, -0.4), (2.5, 1.65)], parent)
    elif kind == 'Social_Media':
        curve = bpy.data.curves.new('Social_At_Icon', 'FONT')
        curve.body = '@'
        curve.align_x = 'CENTER'
        curve.align_y = 'CENTER'
        curve.size = 7.2 * INCH
        curve.extrude = 0.025 * INCH
        obj = bpy.data.objects.new('Social_At_Icon', curve)
        model_collection.objects.link(obj)
        obj.parent = parent
        obj.location.z = ICON_Z
        obj.data.materials.append(orange)
    elif kind == 'Paid_Ads':
        icon_line('Ads_Megaphone', [(-2.5, 0.9), (-0.8, 0.9), (2.3, 2.4),
                  (2.3, -2.1), (-0.8, -0.7), (-2.5, -0.7)], parent, True)
        icon_line('Ads_Handle', [(-1.8, -0.7), (-1, -2.6), (0.1, -2.6), (-0.5, -0.8)], parent)
        icon_line('Ads_Sound', [(3.2, 0.1), (4, 0.1)], parent)
    elif kind == 'Telco':
        icon_box('Telco_Handset', 3.5, 6.5, 0.45, parent)
        icon_box('Telco_Screen', 2.7, 4.7, 0.18, parent, (0, 0.25))
        icon_ellipse('Telco_Home', 0.18, 0.18, parent, (0, -2.75))
    elif kind == 'URLs':
        icon_box('URLs_Left_Link', 4.1, 2.6, 1.25, parent, (-1.2, 0))
        icon_box('URLs_Right_Link', 4.1, 2.6, 1.25, parent, (1.2, 0))
        icon_line('URLs_Bridge', [(-1.4, 0), (1.4, 0)], parent)


kinds = ['Messages', 'Domains', 'Email', 'Social_Media', 'Paid_Ads', 'Telco', 'URLs']
for index, kind in enumerate(kinds):
    angle = radians(90 - index * 360 / 7)
    direction = Vector((cos(angle), sin(angle), 0))
    center = direction * NODE_RADIUS
    node = group(f'Node_{kind}', nodes, center)
    node['type'] = kind
    node['hub_port'] = f'Port_{kind}'
    rounded_slab(f'{kind}_Body', NODE_SIZE, NODE_SIZE, 2.4 * INCH,
                 1.5 * INCH, 0, node_mat, node)
    outline = rounded_outline(NODE_SIZE, NODE_SIZE, 2.4 * INCH)
    tube(f'{kind}_Amber_Border', [(x, y, 1.5 * INCH) for x, y in outline],
         0.09 * INCH, orange, node, True)
    add_icon(kind, node)

    port = group(f'Port_{kind}', hub, direction * HUB_RADIUS)
    rounded_slab(f'{kind}_Port_Lime', 3.4 * INCH, 3.4 * INCH, 0.85 * INCH,
                 0.6 * INCH, 0.95 * INCH, lime, port)
    rounded_slab(f'{kind}_Port_Socket', 1.35 * INCH, 1.35 * INCH, 0.25 * INCH,
                 0.08 * INCH, 1.55 * INCH, port_dark, port)

    # The link starts beneath its card and arrives beneath the raised hub port.
    start = center - direction * (NODE_SIZE * 0.43)
    end = direction * HUB_RADIUS
    link = tube(f'Link_{kind}', [(start.x, start.y, 0.15 * INCH),
                                (end.x, end.y, INCH)],
                0.09 * INCH, orange, links)
    link['source_node'] = node.name
    link['target_port'] = port.name

# Convert export geometry to meshes, retaining independent node/link transforms.
for obj in list(model_collection.objects):
    if obj.type in {'CURVE', 'FONT'}:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='DESELECT')
for obj in model_collection.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root

model_dir = ROOT / 'models'
web_dir = ROOT / 'public' / 'models'
model_dir.mkdir(exist_ok=True)
web_dir.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(web_dir / 'hub-network.glb'), export_format='GLB',
    use_selection=True, export_yup=True, export_animations=False,
    export_extras=True, export_cameras=False, export_lights=False,
)

# Preview floor, camera, and lights are separate and excluded from the GLB.
studio = bpy.data.collections.new('Preview studio')
scene.collection.children.link(studio)


def studio_object(name, data):
    obj = bpy.data.objects.new(name, data)
    studio.objects.link(obj)
    return obj


def aim(obj):
    obj.rotation_euler = (-obj.location).to_track_quat('-Z', 'Y').to_euler()


bpy.ops.mesh.primitive_plane_add(size=200 * INCH, location=(0, 0, -0.035 * INCH))
floor = bpy.context.object
for collection in list(floor.users_collection):
    collection.objects.unlink(floor)
studio.objects.link(floor)
floor.name = 'Preview_Floor'
floor.data.materials.append(material('Floor — charcoal', (0.009, 0.013, 0.018), 0.1, 0.8))

camera_data = bpy.data.cameras.new('Hub preview camera')
camera = studio_object('Hub preview camera', camera_data)
camera.location = (1.45, -2.8, 5.8)
aim(camera)
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.5
scene.camera = camera

for name, location, energy, size in [
    ('Hub key', (-2, -1.5, 4), 500, 3),
    ('Hub fill', (3, 1, 3), 350, 2.5),
    ('Hub rim light', (-1, 3, 2), 400, 2),
]:
    light_data = bpy.data.lights.new(name, 'AREA')
    light_data.energy = energy
    light_data.size = size
    light = studio_object(name, light_data)
    light.location = location
    aim(light)

scene.world = bpy.data.worlds.new('Hub preview world')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.025, 0.035, 0.045, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.3
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1250
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(model_dir / 'hub-network-preview.png')

bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
bpy.context.view_layer.objects.active = root
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.region_3d.view_location = (0, 0, 0)
            space.region_3d.view_distance = 4
            space.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            space.clip_start = 0.001
            space.overlay.show_floor = False
            space.overlay.show_axis_x = False
            space.overlay.show_axis_y = False
            space.shading.color_type = 'MATERIAL'

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(model_dir / 'hub-network.blend'))
print(json.dumps({'asset': 'hub-network', 'nodes': len(kinds),
                  'hub_diameter_inches': 48, 'node_width_inches': 12,
                  'orientation': 'XY floor plane, Z up; GLB Y up',
                  'export_objects': len(model_collection.objects)}))
bpy.ops.render.render(write_still=True)
