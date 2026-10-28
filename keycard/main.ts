import { mount } from 'svelte'
import '../src/app.css'
import KeycardPage from '../src/lib/KeycardPage.svelte'

export default mount(KeycardPage, { target: document.getElementById('app')! })
