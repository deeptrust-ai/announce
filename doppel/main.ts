import { mount } from 'svelte'
import '../src/app.css'
import Scene from '../src/lib/Scene.svelte'

export default mount(Scene, { target: document.getElementById('app')! })
