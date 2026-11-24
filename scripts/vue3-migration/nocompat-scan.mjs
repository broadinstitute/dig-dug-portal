// Lists what a portal's pages reach that Vue 3 without @vue/compat does not have: the worklist for taking our code off
// compat and for writing our own BootstrapVue replacements. Report only: nothing is written. Run it from the repo root:
//
//   npm run tool:nocompat-scan -- --config configs/vue.config.PanKbase.js    # the pages of a build config
//   npm run tool:nocompat-scan -- --entries src/portals/PanKbase/            # the page entries under a folder
//   npm run tool:nocompat-scan -- --json                                     # the hits, the tables and the errors as JSON
//   npm run tool:nocompat-scan -- --root <dir>                               # another checkout (a portal branch)
//
// `--config <vue.config.js>` (a path from the root) reads the pages of a build, which is the scope that counts: a page can
// be outside the folder of its portal (the 404 page of a portal is `src/views/404`). The config is parsed, never run (it
// reads the environment and may do anything else): its `pages` object, the pages that a condition adds or deletes, and
// its webpack aliases. An alias that replaces a package by a file of ours is followed to that file and marked in the
// packages table; the alias of `vue` (the compat shim) is marked and not followed. `--entries <folder>` (repeatable)
// takes the page entries (`main.js`) under that folder; with `--config` the two add up, and with neither every entry is
// scanned. A path that names a file which is no `main.js` is a root of its own. The scan covers the files those pages reach
// through `import`, `export ... from`, `import()` and `require()`, as `component-graph.mjs` follows them, and also an
// import with a static prefix and a variable part (`import(`@/views/${name}.vue`)`) or a `require.context(...)`, which
// webpack turns into one edge to every file that fits. It says how many files that is, and lists every import it could
// not follow (a file that does not exist, a path that is not a string, a pattern that fits nothing, a package that is not
// installed): what hides behind one of those is not scanned.
//
// What it looks for, as kinds (`KINDS` says what each one does on Vue 3). A `hit` is something Vue 3 does differently
// or not at all; a `note` is something to look at, that may be right as it stands.
//
//   Script    the instance members and options that are gone or renamed (`$set`, `$on`, `$children`, `$listeners`,
//             `beforeDestroy`, `filters`, `model`, `render(h)`...), the global `Vue` API (`Vue.extend`, `new Vue`,
//             `Vue.nextTick`...), `$emit` of a native event name without `emits`, array watchers without `deep`.
//   Template  `.native`, `.sync`, numeric key codes, `slot`/`slot-scope`, filters, `v-model` on our own components,
//             `$listeners`, `inline-template`, `is` on plain elements, a `<template>` with no directive, `v-for` with
//             `ref`, `v-if` with `v-for`, attribute values that Vue 3 coerces differently.
//   Styles    the `-enter`/`-leave` transition classes that became `-enter-from`/`-leave-from`; `>>>`, `/deep/`.
//   BootstrapVue
//             every `b-*` tag with its props, events, `v-model`, slots, refs and fallthrough (the specification of
//             our own replacements), the `v-b-*` directives, `$bvModal`/`$bvToast`/`bv::` events, `$refs` of
//             BootstrapVue components with the methods called on them, CSS and selectors that target its classes.
//   Packages  every npm package the reachable files import that itself depends on Vue.
//
// Scripts are read with Babel, as in `component-graph.mjs`, templates and the blocks of a `.vue` file with
// `vue-eslint-parser`, the parser `eslint-plugin-vue` brings, so a comment or a string is never a hit. Styles (the
// `<style>` blocks, the stylesheets that are imported, and what they `@import`: a `~package`, a partial, a file under
// `public/` for a root-absolute path) are read by a small selector scanner. The script blocks do not come from
// `vue/compiler-sfc`, whose `parse` takes other arguments on Vue 2.7 and on Vue 3: the scan needs no Vue 2.7 compiler,
// so it runs on a branch whose `node_modules` has Vue 3 (the tests pass on both).
//
// What it cannot see: a value that is known only at run time (a component chosen by `:is`, a ref name, an event name or
// a key built from a variable: the first is listed as `dynamicComponent`; a `:fields` that is not an array literal, data,
// a computed, a constant or an import is listed as dynamic); a prop, a watcher or an `emits` that a mixin declares for the
// component that uses it (each file is read on its own; only the `data` of a mixin is compared, for `dataMerge`); a prop
// given as `props: ["a"]`, whose type is not known (so a watcher of it is not known to watch an array); `$watch(...)`
// calls; a `v-on` object that is not a literal; JSX attributes (`onChange`); a template written as a string
// (`template: "<b-table>"`); Sass nesting with `&-suffix` (a class named by a suffix); loaders and webpack settings
// other than the aliases; HTML pages (`public/*.html`) that load scripts or styles; `false` bound to a known attribute that
// is not boolean (`:title`, `:href`: Vue 3 writes "false" there too, and they are not listed).
//
// A file that does not parse is listed under Errors, with the line when there is one, and the rest of the tree is
// still scanned.
//
// Exit codes: 0 always (hits and errors are what the report is for), 2 usage error.
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseBabel } from '@babel/parser';
import vueEslintParser from 'vue-eslint-parser';
import { BABEL_OPTIONS, pageEntries, readSources, reachable, resolveImport, toKebab, toKey } from './component-graph.mjs';
import { cell, code, hasSrc, oneLine } from './register-components.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/nocompat-scan.mjs [--root <dir>] [--config <vue.config.js>] [--entries <folder>]... [--json]';

/**
 * The kinds of hit, in report order. `note` ones are listed for a person to look at; they are not necessarily wrong.
 * Each `why` says what the pattern does on Vue 3 without compat.
 */
export const KINDS = [
  // ---- Script: instance members ----
  { key: 'setDelete', group: 'Script', why: '`$set`, `$delete`, `Vue.set` and `Vue.delete` do not exist in Vue 3, which tracks added and deleted keys itself: assign to the key, or `delete` it.' },
  { key: 'eventBus', group: 'Script', why: '`$on`, `$off` and `$once` are gone from component instances and from `new Vue()` used as a bus. A bus needs an emitter of its own, which is no hit (the listener is the receiver in the note column).' },
  { key: 'emitOnOther', group: 'Script', note: true, why: '`$emit` on something other than the component itself (`$root`, `$parent`, a bus): the sending half of a bus. It has to move with the `$on` listeners.' },
  { key: 'children', group: 'Script', why: '`$children` is gone: pass what is needed through props, provide/inject or refs.' },
  { key: 'listeners', group: 'Script', why: '`$listeners` is gone: listeners are in `$attrs` as `onXxx`, so `v-bind="$listeners"` and `v-on="$listeners"` bind nothing, or twice next to `v-bind="$attrs"`.' },
  { key: 'scopedSlots', group: 'Script', why: '`$scopedSlots` is gone: every slot, scoped or not, is a function on `$slots`.' },
  { key: 'destroyMount', group: 'Script', why: '`$destroy` and `$mount` are gone from instances: an app is made with `createApp(...).mount(el)` and removed with `app.unmount()`.' },
  { key: 'removedInternals', group: 'Script', why: '`$vnode`, `$createElement`, `$isServer`, `_uid` and the other internals of a Vue 2 instance do not exist on Vue 3 (`h` is imported, an id is `this.$.uid`).' },
  { key: 'hookEvents', group: 'Script', why: 'The `hook:beforeDestroy` events are not emitted without compat. Vue 3 has vnode hooks (`@vue:before-unmount`) on a component in a template instead.' },
  { key: 'destroyHooks', group: 'Script', why: '`beforeDestroy` and `destroyed` are called `beforeUnmount` and `unmounted` on Vue 3; the old names are never called.' },
  { key: 'parentAccess', group: 'Script', note: true, why: '`$parent` reaches the component that renders this one, and which that is depends on how deep it sits: BootstrapVue\'s portals, a `<teleport>` or a wrapper component that we add put another one in between.' },
  { key: 'attrsUse', group: 'Script', note: true, why: '`$attrs` holds `class`, `style` and the listeners on Vue 3 (it did not on Vue 2), so a `v-bind="$attrs"` on an inner element can double them.' },
  { key: 'slotsAccess', group: 'Script', note: true, why: 'Every slot on `$slots` is a function on Vue 3 (an array of vnodes on Vue 2): a call is needed, and `.length`, `[0]` and iteration no longer work. A truthiness test is the same.' },
  // ---- Global API ----
  { key: 'vueImport', group: 'Global API', why: 'Vue 3 has no default export: `import Vue from "vue"` (a build of Vue 2, or compat) is the whole global `Vue` API, which no longer exists.' },
  { key: 'vueExtend', group: 'Global API', why: '`Vue.extend` is gone: a component is an options object, mounted by an app or rendered with `h`.' },
  { key: 'newVue', group: 'Global API', why: '`new Vue(...)` (and `new` of what `Vue.extend` returned) is gone: `createApp(...)`, or `h` for a component rendered by hand.' },
  { key: 'vueObservable', group: 'Global API', why: '`Vue.observable` is `reactive` from `vue`.' },
  { key: 'vueRegister', group: 'Global API', why: '`Vue.component`, `Vue.use`, `Vue.mixin`, `Vue.directive` and `Vue.filter` are methods of an app (`app.component(...)`...), and filters are gone altogether.' },
  { key: 'vueNextTick', group: 'Global API', why: '`Vue.nextTick` is `nextTick`, imported from `vue`.' },
  { key: 'vueConfig', group: 'Global API', why: '`Vue.config` is `app.config` (`errorHandler`, `warnHandler`, `isCustomElement`...); `productionTip`, `devtools` and `ignoredElements` do not exist.' },
  { key: 'keyCodes', group: 'Global API', why: '`Vue.config.keyCodes` is gone, and so are numeric key code modifiers: `@keyup.f1` and a key name in kebab case replace them.' },
  { key: 'vuePrototype', group: 'Global API', why: '`Vue.prototype.$x` is `app.config.globalProperties.$x`, which exists only on the app that sets it.' },
  { key: 'vueOther', group: 'Global API', why: 'Any other member of the global `Vue` (`Vue.version`, `Vue.compile`, `Vue.util`, `Vue.options`...) is gone or moved.' },
  // ---- Options ----
  { key: 'filtersOption', group: 'Options', why: 'The `filters` option is gone: a filter is a method.' },
  { key: 'modelOption', group: 'Options', why: 'The `model` option is gone: `v-model` on a component is `modelValue` and `update:modelValue` (another name, `v-model:name`).' },
  { key: 'functional', group: 'Options', why: '`functional: true` is gone: a functional component is a function, and a stateful one has no performance cost to save.' },
  { key: 'renderFunction', group: 'Options', why: '`render(h)` and `createElement` do not receive `h` on Vue 3: it is imported from `vue`, and the vnode data is flat (no `attrs`, `on`, `props` objects). JSX needs the Vue 3 plugin.' },
  { key: 'asyncComponent', group: 'Options', why: 'A function in `components` (or `Vue.component(name, fn)`), such as `() => import("./A.vue")` or `(resolve) => require([...], resolve)`, is an async component on Vue 2 and a functional component on Vue 3, which calls it as one: it has to be wrapped in `defineAsyncComponent`.' },
  { key: 'dataMerge', group: 'Options', note: true, why: 'A `data` key that holds an object in the component and in one of its mixins is merged deeply on Vue 2 and, on Vue 3, the component\'s object replaces the mixin\'s whole (the compat flag OPTIONS_DATA_MERGE).' },
  { key: 'propDefaultThis', group: 'Options', why: 'A prop `default` function has no `this` on Vue 3 (it gets the raw props): code that reads another prop or an instance member breaks.' },
  { key: 'dataObject', group: 'Options', why: '`data` has to be a function on Vue 3, also for a root instance.' },
  { key: 'directiveHooks', group: 'Options', why: 'A custom directive\'s hooks `bind`, `inserted`, `update`, `componentUpdated` and `unbind` are `beforeMount`, `mounted`, `beforeUpdate`, `updated` and `unmounted` on Vue 3.' },
  { key: 'inheritAttrs', group: 'Options', note: true, why: '`inheritAttrs: false` with `v-bind="$attrs"`: on Vue 3 `$attrs` has `class`, `style` and the listeners too, so they land on the inner element and no longer on the root.' },
  { key: 'emitInput', group: 'Options', why: '`$emit("input")` is the `v-model` contract of Vue 2 (`value` and `input`); on Vue 3 it is `modelValue` and `update:modelValue`, so the parent\'s `v-model` no longer hears it.' },
  { key: 'emitsMissing', group: 'Options', why: 'A component that emits a native event name (`click`, `input`, `change`...) without listing it in `emits` fires the parent\'s listener twice on Vue 3: once for the event and once as the native event on the root element.' },
  { key: 'watchArrays', group: 'Options', note: true, why: 'A watcher of an array without `deep` runs on Vue 3 only when the array is replaced, not when it is changed in place (`push`, `splice`, an index assignment). The compat flag WATCH_ARRAY that kept the old way is off for our code already.' },
  // ---- Template ----
  { key: 'rootListener', group: 'Template', why: 'A listener with a native event name (`@click`, `@change`, `@input`...) on a component whose `emits` does not list it also lands on the child\'s root element on Vue 3, and so receives the DOM events that bubble from inside it: the handler is called with an Event that it did not expect, and the component\'s own `$emit` of that name fires it twice.' },
  { key: 'native', group: 'Template', why: '`.native` is gone: a listener that is not in `emits` falls through to the root element on its own, and one that is declared is the component\'s own event.' },
  { key: 'sync', group: 'Template', why: '`.sync` is gone: `v-model:name` replaces `:name.sync`, with `update:name` as the event.' },
  { key: 'keyCodeModifier', group: 'Template', why: 'A numeric key code modifier (`@keyup.13`) is gone: use the key name (`.enter`, `.page-down`).' },
  { key: 'oldSlotSyntax', group: 'Template', why: '`slot="name"` and `slot-scope` are gone: `v-slot:name="props"` (`#name="props"`) on a `<template>` or on the component.' },
  { key: 'templateFilters', group: 'Template', why: 'Template filters (`{{ x | f }}`) are gone, and `|` is now the bitwise OR: `x | f` evaluates to a number, with no error.' },
  { key: 'vModelComponent', group: 'Template', why: '`v-model` on a component of ours (or of a package) binds `modelValue` and listens to `update:modelValue` on Vue 3, not `value` and `input`: the child\'s contract has to change with it (see the note column; a child that has the new one is no hit).' },
  { key: 'inlineTemplate', group: 'Template', why: '`inline-template` is gone.' },
  { key: 'isOnElement', group: 'Template', why: '`is` on a plain element needs the `vue:` prefix on Vue 3 (`is="vue:my-row"`); without it the element is a native one with an `is` attribute.' },
  { key: 'templateNoDirective', group: 'Template', why: 'A `<template>` with no `v-if`, `v-for` or `v-slot` renders as a native `<template>` element on Vue 3 (its content is inert), where Vue 2 rendered the children.' },
  { key: 'functionalTemplate', group: 'Template', why: '`<template functional>` is gone.' },
  { key: 'vForRef', group: 'Template', why: 'A `ref` inside `v-for` is an array of elements or components on Vue 3 too, but its order is not the order of the source array; `:ref` as a function is the usual way.' },
  { key: 'ifWithFor', group: 'Template', why: '`v-if` on the element that has `v-for` is read first on Vue 3, so it cannot use the loop variable (it did on Vue 2: `v-for` came first).' },
  { key: 'bindObjectOrder', group: 'Template', note: true, why: '`v-bind="obj"` after an explicit attribute overrides it on Vue 3 (the later one wins); on Vue 2 the explicit attribute always won.' },
  { key: 'attrCoercion', group: 'Template', note: true, why: 'An attribute bound to `false` is kept as the string "false" on Vue 3 (`aria-*`, `data-*` and other attributes that are not boolean) where Vue 2 removed it; `contenteditable`, `draggable` and `spellcheck` are no longer special.' },
  { key: 'multiRoot', group: 'Template', note: true, why: 'A component with more than one root node (a fragment) cannot take `class`, `style` or listeners from its parent on Vue 3 without `v-bind="$attrs"`. Vue 2 refused such a template, so a hit here is Vue 3 code already.' },
  { key: 'fallthroughMultiRoot', group: 'Template', why: '`class`, `style` or a listener passed to a component that renders several roots is dropped with a warning.' },
  { key: 'transitionClasses', group: 'Template', why: 'The transition classes `v-enter` and `v-leave` are `v-enter-from` and `v-leave-from` on Vue 3 (`name-enter`, `name-leave` likewise), and the attributes `enter-class` and `leave-class` are `enter-from-class` and `leave-from-class`.' },
  { key: 'dynamicComponent', group: 'Template', note: true, why: 'A component chosen at run time (`<component :is="x">`, `h(x)`) cannot be read from the file: a BootstrapVue component, or one that needs Vue 2 only, may hide behind it.' },
  { key: 'transitionGroupTag', group: 'Template', why: '`<transition-group>` renders no wrapper element on Vue 3 unless it has a `tag`: styles and layout that count on the `<span>` change.' },
  // ---- Styles ----
  { key: 'scopedDeep', group: 'Styles', note: true, why: '`>>>`, `/deep/` and `::v-deep` without parentheses are deprecated forms of `:deep(...)` in a scoped style: Vue 3\'s compiler still reads them, with a warning.' },
  // ---- BootstrapVue ----
  { key: 'bvTags', group: 'BootstrapVue', why: 'BootstrapVue 2 needs Vue 2: every `b-*` tag is a component of ours to write. The table under BootstrapVue components says what each one is used with.' },
  { key: 'bvImports', group: 'BootstrapVue', why: 'An import of `bootstrap-vue` (the plugin, a component, its icons or its stylesheet) has to go.' },
  { key: 'bvDirectives', group: 'BootstrapVue', why: 'The `v-b-*` directives (`v-b-tooltip`, `v-b-modal`, `v-b-toggle`...) are BootstrapVue\'s; each one is a directive of ours to write.' },
  { key: 'bvInstance', group: 'BootstrapVue', why: '`$bvModal`, `$bvToast` and the `bv::` events on `$root` (`bv::show::modal`, `bv::refresh::table`...) belong to BootstrapVue.' },
  { key: 'bvRefs', group: 'BootstrapVue', why: 'A method called on the ref of a BootstrapVue component (`this.$refs.modal.show()`, `refresh()`, `clearSelected()`) is part of the API our replacement has to have.' },
  { key: 'bvCss', group: 'BootstrapVue', why: 'A selector that targets a class or an id BootstrapVue generates (`.b-table`, `.b-skeleton`, `.bv-no-focus-ring`, `__BVID__`) stops matching when the component is ours.' },
  { key: 'bsCss', group: 'BootstrapVue', note: true, why: 'A selector on a Bootstrap class that BootstrapVue renders (`.page-link`, `.btn-*`, `.modal-*`, `.table-sm`, `.dropdown-*`, `.nav-*`, `.tab-*`, `.toast*`, `.alert*`, `.badge*`, `.card*`): our own component has to keep that markup (the classes and the nesting) for the rule to match.' },
  { key: 'bvDomQuery', group: 'BootstrapVue', why: 'A script that looks up a BootstrapVue class or id (`querySelector(".b-table")`) stops finding it when the component is ours.' },
];

const KIND_KEYS = new Set(KINDS.map(({ key }) => key));

// ---- tags, events and attributes Vue 3 knows --------------------------------------------------------------------------

// Vue 3's `isHTMLTag` and `isSVGTag` lists (`@vue/shared`, `domTagConfig`, as of 3.5; copied from `semantics-scan.mjs`,
// no Vue 3 package is installed in every checkout).
const HTML_TAGS = new Set(
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot'.split(','),
);
const SVG_TAGS = new Set(
  'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view'.split(','),
);
/** Tags that are Vue's own: not components, not elements. */
const BUILT_IN_TAGS = new Set(['component', 'slot', 'template', 'transition', 'transition-group', 'transitiongroup', 'keep-alive', 'keepalive', 'teleport', 'suspense']);

/** Event names the browser fires on an element: a component that `$emit`s one without `emits` fires twice on Vue 3. */
const NATIVE_EVENTS = new Set(
  'click,dblclick,auxclick,contextmenu,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,wheel,scroll,resize,keydown,keyup,keypress,input,change,beforeinput,focus,blur,focusin,focusout,submit,reset,select,invalid,search,drag,dragstart,dragend,dragenter,dragleave,dragover,drop,copy,cut,paste,touchstart,touchend,touchmove,touchcancel,pointerdown,pointerup,pointermove,pointerenter,pointerleave,pointercancel,load,error,abort,toggle,close,cancel,play,pause,ended,canplay,loadeddata,loadedmetadata,animationend,transitionend,fullscreenchange'.split(','),
);

/**
 * Attributes that are well known: not listed by `attrCoercion`. The boolean ones (`disabled`, `checked`...) are the same on both
 * versions when bound to `false`; for the others (`title`, `href`, `value`...) Vue 3 writes "false" where Vue 2 removed the
 * attribute, but they are so many that listing them would bury the `aria-*`, `data-*` and unknown attributes that are asked for.
 */
const KNOWN_ATTRIBUTES = new Set(
  'id,class,style,key,ref,is,value,type,name,placeholder,href,src,alt,title,for,tabindex,role,width,height,min,max,step,maxlength,minlength,pattern,rows,cols,size,colspan,rowspan,target,rel,action,method,accept,autocomplete,enctype,download,lang,dir,accesskey,span,label,wrap,crossorigin,loading,srcset,sizes,media,list,form,cite,datetime,headers,scope,poster,preload,disabled,readonly,required,multiple,selected,hidden,autofocus,open,novalidate,autoplay,controls,loop,muted,async,defer,itemscope,inert,ismap,default,reversed,formnovalidate,allowfullscreen,indeterminate,srcdoc,sandbox,allow,start,high,low,optimum,nonce,integrity,usemap,coords,shape,hspace,vspace,border,cellpadding,cellspacing,align,valign,bgcolor,color,face,frameborder,scrolling,marginheight,marginwidth,summary,abbr,char,charset,content,http-equiv,mediagroup,kind,srclang,manifest,profile,version,xmlns'.split(','),
);
const ENUMERATED_ATTRIBUTES = new Set(['contenteditable', 'draggable', 'spellcheck']);

// ---- helpers -------------------------------------------------------------------------------------------------------

const MAX_TEXT = 120;
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const shorten = (text) => {
  const line = oneLine(text);
  return line.length > MAX_TEXT ? `${line.slice(0, MAX_TEXT - 3)}...` : line;
};
const unique = (list) => [...new Set(list)];
// Hits are added in the order of the source, and `sort` is stable: file, then line, keeps that order.
const sortHits = (a, b) => byCodeUnit(a.file, b.file) || a.line - b.line;

/** Babel (`StringLiteral`) and ESTree (`Literal`) string literals. */
const isString = (node) => node?.type === 'StringLiteral' || (node?.type === 'Literal' && typeof node.value === 'string');
/** The text of a string literal or of a template literal with no expression, else null. */
const stringOf = (node) => {
  if (isString(node)) return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};
const isMember = (node) => node?.type === 'MemberExpression' || node?.type === 'OptionalMemberExpression';
const isCall = (node) => node?.type === 'CallExpression' || node?.type === 'OptionalCallExpression';
const isFunction = (node) => ['FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod', 'FunctionDeclaration', 'ClassMethod'].includes(node?.type);
const isProperty = (node) => node?.type === 'ObjectProperty' || node?.type === 'Property' || node?.type === 'ObjectMethod';
const isLiteralValue = (node) =>
  ['StringLiteral', 'NumericLiteral', 'BooleanLiteral', 'NullLiteral', 'BigIntLiteral', 'RegExpLiteral', 'Literal'].includes(node?.type) || (node?.type === 'TemplateLiteral' && node.expressions.length === 0);

/** The name of `a.b` or `a["b"]`, else null. */
function memberName(node) {
  if (!isMember(node)) return null;
  if (!node.computed) return node.property.type === 'Identifier' ? node.property.name : null;
  return stringOf(node.property);
}

/** The key of a non-computed object property or method as written (`name` and `"name"` alike), else null. */
function keyName(property) {
  if (!isProperty(property) || property.computed) return null;
  if (property.key.type === 'Identifier') return property.key.name;
  return stringOf(property.key);
}

/** The value node of an object property, or the method itself for `name() {}`. */
const valueOf = (property) => (property.type === 'ObjectMethod' ? property : property.value);

/** The properties of an object expression that have a name. */
function entriesOf(object) {
  return object.properties.filter(isProperty).map((property) => ({ key: keyName(property), property, value: valueOf(property) }));
}

const extensionOf = (file) => file.slice(file.lastIndexOf('.') + 1).toLowerCase();
const STYLE_EXTENSIONS = new Set(['css', 'scss', 'sass', 'less', 'styl']);

// ---- reading a tree --------------------------------------------------------------------------------------------------

/**
 * The files under `<root>/src` that are not scripts, for the imports of stylesheets and assets: `{ path -> text }` for
 * stylesheets and `{ path -> null }` for everything else (images, fonts, JSON), which only have to be found.
 * @param {string} root
 * @returns {Map<string, string | null>}
 */
export function readAssets(root) {
  const assets = new Map();
  const list = (dir) => {
    if (!existsSync(join(root, dir))) return;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') list(path);
      } else if (entry.isFile() && !/\.(vue|js)$/.test(entry.name)) {
        assets.set(path, STYLE_EXTENSIONS.has(extensionOf(entry.name)) ? readFileSync(join(root, path), 'utf8') : null);
      }
    }
  };
  list('src');
  list('public');
  return new Map([...assets].sort(([a], [b]) => byCodeUnit(a, b)));
}

/**
 * Reads what the installed copy of a package says about itself: `{ version, dependencies, peerDependencies,
 * importsVue }`, or null when it is not installed. `importsVue` is whether its entry file mentions `vue`
 * (`from "vue"`, `require("vue")`).
 * @param {string} root
 * @returns {(name: string) => object | null}
 */
export function manifestReader(root) {
  const cache = new Map();
  return (name) => {
    if (cache.has(name)) return cache.get(name);
    let found = null;
    try {
      const dir = join(root, 'node_modules', name);
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      let importsVue = false;
      for (const field of [manifest.module, manifest.main]) {
        if (typeof field !== 'string') continue;
        try {
          const path = join(dir, field);
          if (statSync(path).isFile() && statSync(path).size < 12e6) importsVue ||= /(?:from\s*|require\(\s*|import\(\s*)["']vue["']/.test(readFileSync(path, 'utf8'));
        } catch {
          // An entry that is not a file: no signal.
        }
      }
      found = { version: manifest.version, dependencies: manifest.dependencies ?? {}, peerDependencies: manifest.peerDependencies ?? {}, importsVue };
    } catch {
      found = null;
    }
    cache.set(name, found);
    return found;
  };
}

// ---- parsing ---------------------------------------------------------------------------------------------------------

// What `vue-eslint-parser` reports for `<div />`, which is valid in a single-file component.
const SELF_CLOSING = 'non-void-html-element-start-tag-with-trailing-solidus';
// Babel node keys that hold positions or comments rather than child nodes.
const NOT_CHILDREN = new Set(['loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'errors', 'tokens']);

/** Calls `enter(node, parent)` on every Babel node under `node`, children in source order. */
function traverse(node, enter, parent = null) {
  if (Array.isArray(node)) {
    for (const child of node) traverse(child, enter, parent);
  } else if (node && typeof node.type === 'string') {
    enter(node, parent);
    for (const [key, child] of Object.entries(node)) if (!NOT_CHILDREN.has(key) && child && typeof child === 'object') traverse(child, enter, node);
  }
}

/** A file read: its script blocks as ASTs, its template tree, its styles, and what it imports. */
function parseFile(file, source) {
  const parsed = { file, source, blocks: [], body: null, styles: [], specs: [], errors: [], isSfc: file.endsWith('.vue') };
  const parseBlock = (block) => {
    try {
      const ast = parseBabel(block.content, { ...BABEL_OPTIONS, startLine: block.startLine });
      for (const error of ast.errors ?? []) parsed.errors.push({ file, kind: 'parse', message: oneLine(error.message), line: error.loc?.line });
      parsed.blocks.push({ ast, text: block.content });
      collectSpecs(ast, block.content, parsed.specs);
    } catch (error) {
      parsed.errors.push({ file, kind: 'parse', message: oneLine(error.message), line: error.loc?.line });
    }
  };
  if (!parsed.isSfc) {
    parseBlock({ content: source, startLine: 1 });
    return parsed;
  }
  let result;
  try {
    // `parser: false` leaves the scripts to Babel, which reads JSX and the rest of what the codebase writes.
    result = vueEslintParser.parseForESLint(source, { parser: false, ecmaVersion: 2022, sourceType: 'module', filePath: file });
  } catch (error) {
    parsed.errors.push({ file, kind: 'parse', message: oneLine(error.message), line: error.lineNumber });
    return parsed;
  }
  const top = result.services.getDocumentFragment().children.filter((node) => node.type === 'VElement');
  // The script blocks come from this parser too, not from the SFC parser of `vue/compiler-sfc`: its API differs between Vue 2.7
  // and Vue 3, and the scan has to run on a branch that has only one of them.
  const srcOf = (element) => element.startTag.attributes.find((attribute) => !attribute.directive && attribute.key.name === 'src')?.value?.value;
  const relativeSrc = (src) => (src.startsWith('.') || src.startsWith('@/') ? src : `./${src}`);
  for (const element of top.filter((node) => node.name === 'script')) {
    const src = srcOf(element);
    if (src !== undefined) {
      // The file it names is an import of this one, and is scanned as a file of its own.
      parsed.specs.push({ source: relativeSrc(src), kind: 'import', line: element.loc.start.line, text: `<script src="${src}">`, names: [] });
      parsed.errors.push({ file, kind: 'src', message: `<script src="${src}"> is scanned as the file it names: its component is not joined to this template (refs, emits, data)`, line: element.loc.start.line });
    } else if (element.children.length > 0) {
      parseBlock({ content: element.children.map((child) => child.value ?? '').join(''), startLine: element.children[0].loc.start.line });
    }
  }
  if (!top.some((node) => node.name === 'script') && /^<script[\s>]/m.test(source)) parsed.errors.push({ file, kind: 'parse', message: '<script> block not found by the parser' });
  parsed.body = result.ast.templateBody ?? null;
  const templateElement = top.find((node) => node.name === 'template');
  if (templateElement && srcOf(templateElement) !== undefined) {
    parsed.body = null;
    parsed.errors.push({ file, kind: 'template', message: `<template src="${srcOf(templateElement)}"> is not read`, line: templateElement.loc.start.line });
  } else if (!parsed.body && templateElement) {
    parsed.errors.push({ file, kind: 'template', message: 'the <template> is not plain HTML, so it was not scanned' });
  }
  for (const error of parsed.body?.errors ?? []) {
    if (error.code !== SELF_CLOSING) parsed.errors.push({ file, kind: 'template', message: oneLine(error.message), line: error.lineNumber });
  }
  parsed.styleSources = [];
  for (const element of top.filter((node) => node.name === 'style')) {
    const attributes = Object.fromEntries(element.startTag.attributes.map((attribute) => [attribute.key.name, attribute.value?.value ?? true]));
    if (typeof attributes.src === 'string') parsed.styleSources.push({ src: attributes.src, line: element.loc.start.line });
    const text = element.children.map((child) => child.value ?? '').join('');
    parsed.styles.push({ text, startLine: element.children[0]?.loc.start.line ?? element.loc.start.line, lang: attributes.lang === true ? '' : (attributes.lang ?? 'css'), scoped: attributes.scoped !== undefined });
  }
  if (parsed.body) {
    // `require(...)` in a template expression is an import too.
    vueEslintParser.AST.traverseNodes(parsed.body, {
      enterNode(node) {
        if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require' && isString(node.arguments[0])) {
          parsed.specs.push({ source: node.arguments[0].value, kind: 'require', line: node.loc.start.line, text: `require("${node.arguments[0].value}")` });
        }
      },
      leaveNode() {},
    });
  }
  return parsed;
}

// ---- imports ---------------------------------------------------------------------------------------------------------

/**
 * What the path argument of `import()` or `require()` is: a string, a template or a concatenation with a static
 * start and end (`prefix` and `suffix`), or something that is not a path we can read (`unknown`).
 */
function pathOf(node, text) {
  const literal = stringOf(node);
  if (literal !== null) return { source: literal };
  if (node.type === 'TemplateLiteral') {
    return { prefix: node.quasis[0].value.cooked, suffix: node.quasis.at(-1).value.cooked, expression: text.slice(node.start, node.end) };
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const parts = [];
    const flatten = (part) => (part.type === 'BinaryExpression' && part.operator === '+' ? (flatten(part.left), flatten(part.right)) : parts.push(part));
    flatten(node);
    let prefix = '';
    let at = 0;
    while (at < parts.length && stringOf(parts[at]) !== null) prefix += stringOf(parts[at++]);
    let suffix = '';
    let end = parts.length;
    while (end > at && stringOf(parts[end - 1]) !== null) suffix = stringOf(parts[--end]) + suffix;
    return { prefix, suffix, expression: text.slice(node.start, node.end) };
  }
  return { unknown: true, expression: text.slice(node.start, node.end) };
}

/**
 * The imports of one script, each as `{ source, kind, line, text, names }` for a path that is a string, or with
 * `prefix`/`suffix` (a variable part in the middle), `context` (`require.context`) or `unknown` (not a string).
 * `names` are what an `import` takes: `default`, `*`, a name, or none for `import "x"`.
 */
function collectSpecs(ast, text, specs) {
  const slice = (node) => text.slice(node.start, node.end);
  traverse(ast.program, (node) => {
    if (node.type === 'ImportDeclaration') {
      const names = node.specifiers.map((specifier) =>
        specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.type === 'ImportNamespaceSpecifier' ? '*' : (specifier.imported.name ?? specifier.imported.value),
      );
      specs.push({ source: node.source.value, kind: 'import', line: node.loc.start.line, text: slice(node), names });
    } else if ((node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') && node.source) {
      specs.push({ source: node.source.value, kind: 'export from', line: node.loc.start.line, text: slice(node), names: [] });
    } else if (node.type === 'CallExpression') {
      const { callee } = node;
      const [first] = node.arguments;
      const line = node.loc.start.line;
      if (callee.type === 'Import' || (callee.type === 'Identifier' && callee.name === 'require')) {
        const kind = callee.type === 'Import' ? 'dynamic import' : 'require';
        if (first !== undefined) specs.push({ kind, line, text: slice(node), ...pathOf(first, text) });
      } else if (isMember(callee) && callee.object.type === 'Identifier' && callee.object.name === 'require' && memberName(callee) === 'context') {
        const [directory, recursive, pattern] = node.arguments;
        const known = isString(directory) && (recursive === undefined || recursive.type === 'BooleanLiteral') && (pattern === undefined || pattern.type === 'RegExpLiteral');
        specs.push({
          kind: 'require.context',
          line,
          text: slice(node),
          context: known ? { directory: directory.value, recursive: recursive?.value ?? false, pattern: pattern?.pattern ?? '^\\.\\/.*$', flags: pattern?.flags ?? '' } : null,
          unknown: !known,
          expression: slice(node),
        });
      }
    }
  });
}

const isLocalPath = (path) => path.startsWith('@/') || path.startsWith('./') || path.startsWith('../') || path === '.' || path === '..';

/** The path a local one names, from the root, with a trailing `/` kept: `@/views/` -> `src/views/`. */
function localBase(from, path) {
  return path.startsWith('@/') ? posix.normalize(`src/${path.slice(2)}`) : posix.join(posix.dirname(from), path);
}

/** The package an import of `source` names (`vue`, `@scope/name`), or null for a local path. */
function packageOf(source) {
  if (isLocalPath(source) || source.startsWith('/') || source.includes('!')) return null;
  const path = source.startsWith('~') ? source.slice(1) : source;
  const parts = path.split('/');
  return path.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/**
 * Follows the imports of a file: `{ targets }` the files they reach (scripts and assets), `{ unresolved }` the
 * ones that find nothing, `{ dynamic }` the patterns that were expanded and `{ packages }` the bare imports.
 */
function resolveSpecs(file, specs, allFiles, aliases = []) {
  const found = { targets: [], unresolved: [], dynamic: [], packages: [] };
  const fail = (spec, specifier, why) => found.unresolved.push({ file, line: spec.line, specifier, kind: spec.kind, why });
  for (const spec of specs) {
    if (spec.source !== undefined) {
      const package_ = packageOf(spec.source);
      const alias = package_ === null ? null : aliasFor(aliases, spec.source);
      if (alias !== null && alias.local) {
        // The build replaces this package (or path) by a file of ours; the compat shim of `vue` is what Task 11 removes.
        const rest = spec.source.slice(alias.key.length).replace(/^\//, '');
        const base = rest === '' ? alias.to : posix.join(alias.to, rest);
        const target = alias.key === 'vue' ? null : ['', '.vue', '.js', '/index.js', '/index.vue'].map((extension) => base + extension).find((path) => allFiles.has(path)) ?? null;
        if (alias.key !== 'vue' && target === null) fail(spec, spec.source, `the alias ${alias.key} -> ${alias.to} finds no file`);
        else if (target !== null) found.targets.push({ target, spec });
        if (isPackageName(alias.key)) found.packages.push({ ...spec, package: alias.key, alias: `${alias.to}${alias.key === 'vue' ? ' (not followed)' : ''}` });
      } else if (package_ !== null) {
        found.packages.push({ ...spec, package: package_ });
      } else if (isLocalPath(spec.source)) {
        const target = resolveImport(file, spec.source, allFiles);
        if (target === null) fail(spec, spec.source, 'no such file');
        else found.targets.push({ target, spec });
      } else {
        fail(spec, spec.source, spec.source.includes('!') ? 'loader syntax is not followed' : 'not a path inside src/');
      }
    } else if (spec.context !== undefined && spec.context !== null) {
      const { directory, recursive, pattern, flags } = spec.context;
      const display = `require.context("${directory}", ${recursive ? 'recursive' : 'flat'}, /${pattern}/${flags})`;
      const base = isLocalPath(directory) ? localBase(file, directory.endsWith('/') ? directory : `${directory}/`) : null;
      const expression = new RegExp(pattern, flags);
      const matched = base === null ? [] : [...allFiles].filter((path) => path.startsWith(base) && (recursive || !path.slice(base.length).includes('/')) && expression.test(`./${path.slice(base.length)}`));
      if (matched.length === 0) fail(spec, display, base === null ? 'not a local folder' : 'matches no file');
      else found.dynamic.push({ file, line: spec.line, pattern: display, matched: matched.sort(byCodeUnit) });
      for (const path of matched) found.targets.push({ target: path, spec });
    } else if (spec.unknown) {
      fail(spec, spec.expression, 'the path is not a string');
    } else {
      const { prefix, suffix } = spec;
      const pattern = `${prefix}*${suffix}`;
      if (!isLocalPath(prefix)) {
        fail(spec, spec.expression, 'no static prefix to look under');
      } else {
        const base = localBase(file, prefix);
        const matched = [...allFiles].filter((path) => path.startsWith(base) && path.endsWith(suffix) && path.length >= base.length + suffix.length).sort(byCodeUnit);
        if (matched.length === 0) fail(spec, spec.expression, `no file matches ${pattern}`);
        else found.dynamic.push({ file, line: spec.line, pattern, matched });
        for (const path of matched) found.targets.push({ target: path, spec });
      }
    }
  }
  return found;
}

// ---- the build config ---------------------------------------------------------------------------------------------------------

/** The value of a webpack alias as written: a string, `require.resolve("...")`, or `path.resolve(__dirname, "...")`. */
function aliasTarget(node, configPath) {
  const text = stringOf(node);
  if (text !== null) return text.startsWith('.') ? { to: posix.normalize(posix.join(posix.dirname(configPath), text)), local: true } : { to: text, local: false };
  if (!isCall(node)) return null;
  const { callee } = node;
  const strings = node.arguments.map(stringOf);
  if (isMember(callee) && callee.object.name === 'require' && memberName(callee) === 'resolve' && strings.length === 1 && strings[0] !== null) {
    return strings[0].startsWith('.') ? { to: posix.normalize(posix.join(posix.dirname(configPath), strings[0])), local: true } : { to: strings[0], local: false };
  }
  if (isMember(callee) && ['resolve', 'join'].includes(memberName(callee)) && node.arguments[0]?.type === 'Identifier' && node.arguments[0].name === '__dirname' && strings.slice(1).every((part) => part !== null)) {
    return { to: posix.normalize(posix.join(posix.dirname(configPath), ...strings.slice(1))), local: true };
  }
  return null;
}

/**
 * Reads what the scan needs from a build config (`vue.config.js`): the pages (`pages: { name: { entry, template } }`, also
 * the ones a condition adds or deletes afterwards), and the webpack aliases (`config.resolve.alias.set(key, value)`, or an
 * `alias` object). The config is parsed, never run: it reads the environment and prints, and a build config of a portal
 * may do more. What it computes at run time is not known: a `pages` that is not an object literal, or an alias that is
 * not a string, `require.resolve` or `path.resolve(__dirname, ...)`, is an error.
 * @param {string} source the text of the config
 * @param {string} path where it is, relative to the root of the tree (aliases are relative to its folder)
 * @returns {{ path: string, pages: { name: string, entry: string, template: string | null }[], conditional: string[],
 *   aliases: { key: string, exact: boolean, to: string, local: boolean }[], errors: ScanError[] }}
 */
export function readBuildConfig(source, path) {
  const result = { path, pages: [], conditional: [], aliases: [], errors: [] };
  const fail = (message, line) => result.errors.push({ file: path, kind: 'config', message, line });
  let ast;
  try {
    ast = parseBabel(source, BABEL_OPTIONS);
  } catch (error) {
    fail(`cannot be parsed: ${oneLine(error.message)}`, error.loc?.line);
    return result;
  }
  const declared = new Map();
  for (const node of ast.program.body) {
    if (node.type === 'VariableDeclaration') for (const declarator of node.declarations) if (declarator.id.type === 'Identifier' && declarator.init) declared.set(declarator.id.name, declarator.init);
  }
  let exported = null;
  for (const node of ast.program.body) {
    const assignment = node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' ? node.expression : null;
    if (assignment && isMember(assignment.left) && assignment.left.object.name === 'module' && memberName(assignment.left) === 'exports') exported = assignment.right;
    else if (node.type === 'ExportDefaultDeclaration') exported = node.declaration;
  }
  if (exported?.type === 'Identifier') exported = declared.get(exported.name) ?? null;
  const pagesEntry = exported?.type === 'ObjectExpression' ? entriesOf(exported).find(({ key }) => key === 'pages') : undefined;
  let pagesName = 'pages';
  let pagesNode = pagesEntry?.value;
  if (pagesNode?.type === 'Identifier') {
    pagesName = pagesNode.name;
    pagesNode = declared.get(pagesNode.name);
  }
  const addPage = (name, node, line) => {
    const fields = node?.type === 'ObjectExpression' ? entriesOf(node) : [];
    const entry = stringOf(fields.find(({ key }) => key === 'entry')?.value);
    const template = stringOf(fields.find(({ key }) => key === 'template')?.value);
    if (entry === null) fail(`the page ${name} has no \`entry\` that is a string`, line);
    else result.pages.push({ name, entry, template });
  };
  if (pagesNode?.type !== 'ObjectExpression') {
    fail('no `pages` object literal could be read: the pages are not known', pagesEntry?.property.loc.start.line);
  } else {
    for (const { key, property, value } of entriesOf(pagesNode)) addPage(key ?? '?', value, property.loc.start.line);
  }
  const isPages = (node) => node?.type === 'Identifier' && node.name === pagesName;
  traverse(ast.program, (node) => {
    if (node.type === 'AssignmentExpression' && isMember(node.left) && isPages(node.left.object)) {
      const name = memberName(node.left) ?? '...';
      result.conditional.push(`line ${node.loc.start.line}: pages.${name} is added`);
      if (node.right.type === 'ObjectExpression') addPage(name, node.right, node.loc.start.line);
    } else if (node.type === 'UnaryExpression' && node.operator === 'delete' && isMember(node.argument) && isPages(node.argument.object)) {
      result.conditional.push(`line ${node.loc.start.line}: pages.${memberName(node.argument) ?? '...'} is deleted`);
    } else if (isCall(node) && isMember(node.callee) && memberName(node.callee) === 'set' && isMember(node.callee.object) && memberName(node.callee.object) === 'alias') {
      addAlias(result, node.arguments[0], node.arguments[1], path, node.loc.start.line);
    } else if (isProperty(node) && keyName(node) === 'alias' && valueOf(node).type === 'ObjectExpression') {
      for (const entry of entriesOf(valueOf(node))) addAlias(result, entry.property.key.type === 'Identifier' ? { type: 'StringLiteral', value: entry.key } : entry.property.key, entry.value, path, entry.property.loc.start.line);
    }
  });
  return result;
}

function addAlias(result, keyNode, valueNode, path, line) {
  const key = stringOf(keyNode);
  const target = aliasTarget(valueNode, path);
  if (key === null || target === null) {
    result.errors.push({ file: path, kind: 'config', message: `an alias is not a string or a require.resolve of one, so it is not known`, line });
    return;
  }
  result.aliases.push({ key: key.replace(/\$$/, ''), exact: key.endsWith('$'), to: target.to, local: target.local });
}

/** Whether an alias key names a package (`vue`, `@scope/name`) and not a path alias (`@`, `@lib`). */
const isPackageName = (key) => (key.startsWith('@') ? key.includes('/') : !key.includes('/'));

/** The alias that an import of `source` falls under, or null. */
function aliasFor(aliases, source) {
  return aliases.find(({ key, exact }) => source === key || (!exact && source.startsWith(`${key}/`))) ?? null;
}

// ---- the scan --------------------------------------------------------------------------------------------------------

/** @typedef {{ file: string, line: number, text: string, note?: string, detail?: object }} Hit */

/**
 * Scans the files that the page entries reach, and returns what it found.
 *
 * `sources` is what `readSources` returns (path -> text of every `.vue` and `.js` file under `src/`). `options`:
 *  - `entries`: folders (or `main.js` paths) whose page entries to scan; the default is every entry.
 *  - `assets`: what `readAssets` returns, so that an import of a stylesheet or an image is found, and a stylesheet read.
 *  - `manifest`: `(package name) => { version, dependencies, peerDependencies, importsVue } | null`, what an installed
 *    package says about itself (`manifestReader(root)`); without it no package is known to depend on Vue except by its name.
 *
 * Errors are collected, not thrown, and the rest of the tree is still scanned.
 * @param {Map<string, string>} sources
 * @param {{ entries?: string[], assets?: Map<string, string | null>, manifest?: (name: string) => object | null }} [options]
 */
export function scan(sources, options = {}) {
  const assets = options.assets ?? new Map();
  const errors = [];
  const hits = Object.fromEntries(KINDS.map(({ key }) => [key, []]));
  const config = options.config ? readBuildConfig(options.config.source, options.config.path) : null;
  if (config) errors.push(...config.errors);
  const aliases = config?.aliases ?? [];

  // 1. Read every file, and follow every import.
  const parsed = new Map([...sources].sort(([a], [b]) => byCodeUnit(a, b)).map(([file, source]) => [file, parseFile(file, source)]));
  const allFiles = new Set([...sources.keys(), ...assets.keys()]);
  const followed = new Map();
  const imports = new Map();
  for (const [file, read] of parsed) {
    const result = resolveSpecs(file, read.specs, allFiles, aliases);
    followed.set(file, result);
    imports.set(file, unique(result.targets.map(({ target }) => target).filter((target) => sources.has(target))));
  }

  // 2. The files the entries reach.
  const prefixes = options.entries ?? [];
  const every = pageEntries(sources);
  const matches = (entry, prefix) => entry === prefix || entry.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
  // A prefix that names a file which is no page entry is a root of its own (what a build alias brings in, say).
  const extra = prefixes.filter((prefix) => sources.has(prefix) && !every.includes(prefix));
  // The pages of a build config are roots whatever their file is called.
  const configured = unique((config?.pages ?? []).map(({ entry }) => entry));
  for (const entry of configured) {
    if (!sources.has(entry)) errors.push({ file: entry, kind: 'scope', message: `the build config ${config.path} names the page entry ${entry}, which is no file` });
  }
  const chosen = prefixes.length === 0 && config === null ? every : [...every.filter((entry) => prefixes.some((prefix) => matches(entry, prefix))), ...extra, ...configured.filter((entry) => sources.has(entry))];
  const entries = unique(chosen).sort(byCodeUnit);
  for (const prefix of prefixes) {
    if (!every.some((entry) => matches(entry, prefix)) && !extra.includes(prefix)) errors.push({ file: prefix, kind: 'scope', message: `no page entry (main.js) under ${prefix}` });
  }
  const reached = new Set();
  for (const entry of entries) for (const file of reachable(imports, entry)) reached.add(file);
  const files = [...reached].sort(byCodeUnit);
  const scope = { prefixes, entries, files, total: sources.size };
  if (config) scope.config = { path: config.path, pages: config.pages, conditional: config.conditional, aliases: config.aliases };

  // 3. What they import that cannot be followed, and what was expanded.
  const unresolved = files.flatMap((file) => followed.get(file).unresolved).sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line);
  const dynamic = files.flatMap((file) => followed.get(file).dynamic).sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line);
  for (const file of files) errors.push(...parsed.get(file).errors);

  // 4. The patterns.
  const context = makeContext({ sources, parsed, followed, files, allFiles, aliases, hits, assets, manifest: options.manifest ?? null, unresolved });
  for (const file of files) scanFile(context, file);
  const styleFiles = unique(files.flatMap((file) => followed.get(file).targets.map(({ target }) => target)).filter((target) => STYLE_EXTENSIONS.has(extensionOf(target)))).sort(byCodeUnit);
  for (const path of styleFiles) scanAsset(context, path);

  const tables = finish(context);
  for (const list of Object.values(hits)) list.sort(sortHits);
  errors.sort((a, b) => byCodeUnit(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0));
  unresolved.sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line);
  return { scope, hits, ...tables, dynamic, unresolved, errors };
}

// ---- the context every pass shares -------------------------------------------------------------------------------

function makeContext(base) {
  const context = {
    ...base,
    infos: new Map(),
    bvTags: new Map(),
    bvDirectives: new Map(),
    stylePackages: [],
    styleSeen: new Set(),
    itemKeys: new Map(),
    bvCalls: [],
    directiveSeen: new Set(),
    /** Adds a hit; `extra` is `{ note, detail }`. */
    add(kind, file, line, text, extra = {}) {
      if (!KIND_KEYS.has(kind)) throw new Error(`unknown kind ${kind}`);
      context.hits[kind].push({ file, line, text: shorten(text), ...extra });
    },
  };
  return context;
}

/** What the scan has besides the hits: the tables. */
function finish(context) {
  const bvCalls = [...context.bvCalls].sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line);
  return { ...bootstrapTables(context), bvCalls, packages: packageTable(context) };
}

// ---- reading a script: what a file declares -----------------------------------------------------------------------------

/** Option keys that only a component (or a mixin) has: an object with one of them, in a plausible shape, is an options object. */
const STRONG_KEYS = new Set([
  'methods', 'computed', 'watch', 'components', 'directives', 'mixins', 'extends', 'provide', 'inject', 'emits',
  'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed', 'activated', 'deactivated', 'errorCaptured',
]);
/** Every option key the scan reads: an `export default` object with one of them is a component too. */
const OPTION_KEYS = new Set([...STRONG_KEYS, 'render', 'props', 'data', 'model', 'filters', 'functional', 'inheritAttrs', 'name', 'template', 'el', 'store']);
/** Options whose value is an object of its own, not an options object: what is inside is not a component. */
const CONTAINER_KEYS = new Set(['methods', 'computed', 'watch', 'props', 'inject', 'provide', 'directives', 'filters', 'components', 'emits', 'data', 'store', 'getters', 'state', 'actions', 'mutations']);
const HOOK_KEYS = new Set(['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed', 'activated', 'deactivated', 'errorCaptured']);
const LEGACY_DIRECTIVE_HOOKS = new Set(['bind', 'inserted', 'update', 'componentUpdated', 'unbind']);
const MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']);
const REMOVED_INTERNALS = new Set(['$vnode', '$createElement', '$isServer', '$ssrContext']);
const REMOVED_PRIVATES = new Set(['_uid', '_isVue', '_data', '_events', '_watcher', '_watchers', '_vnode']);
const VUE_REGISTER = new Set(['component', 'use', 'mixin', 'directive', 'filter']);

/** Whether `value` can be what a component option `key` holds: a literal where a function belongs is a data property that shares the name. */
function plausible(key, value) {
  if (HOOK_KEYS.has(key)) return value !== undefined && !isLiteralValue(value) && !['ObjectExpression'].includes(value.type);
  if (key === 'render') return isFunction(value);
  if (['mixins', 'emits'].includes(key)) return value?.type === 'ArrayExpression' || (key === 'emits' && value?.type === 'ObjectExpression');
  if (['provide', 'inject'].includes(key)) return ['ObjectExpression', 'ArrayExpression'].includes(value?.type) || isFunction(value);
  if (key === 'extends') return value?.type === 'Identifier' || value?.type === 'ObjectExpression';
  return value?.type === 'ObjectExpression';
}

/** Whether `node`, the object of a `Vue.extend(...)` or `new Vue(...)`, or any call of this kind, is passed as component options. */
function isOptionsArgument(info, parent) {
  if (parent?.type === 'NewExpression') return isVueRef(info, parent.callee) || (parent.callee.type === 'Identifier' && info.ctors.has(parent.callee.name));
  if (!isCall(parent)) return false;
  const { callee } = parent;
  if (callee.type === 'Identifier') return ['defineComponent', 'createApp'].includes(callee.name);
  return isMember(callee) && isVueRef(info, callee.object) && ['extend', 'component', 'mixin'].includes(memberName(callee));
}

/**
 * Whether the object literal `node` is a component's options (or a mixin's). `parent(n)` is the parent of a node.
 * An `export default` object counts with any option key; elsewhere it takes a key only a component has, with a
 * value that can be what that option holds. What is inside `methods` or `props` is never options.
 */
function isOptionsObject(info, parent, node) {
  const up = parent(node);
  if (isProperty(up) && CONTAINER_KEYS.has(keyName(up))) return false;
  if (isOptionsArgument(info, up)) return true;
  // `components: { Name: { ... } }`: a component written in place.
  if (isProperty(up) && isProperty(parent(parent(up))) && keyName(parent(parent(up))) === 'components') return true;
  // `const Name = { ... }` that a component registers, extends or exports.
  if (up?.type === 'VariableDeclarator' && up.id.type === 'Identifier' && info.registered.has(up.id.name)) return true;
  const entries = entriesOf(node);
  const strong = entries.some(({ key, value }) => STRONG_KEYS.has(key) && plausible(key, value));
  // A render function that takes `h` is a component, wherever it is written.
  const renders = entries.some(({ key, value }) => key === 'render' && isFunction(value) && ['h', '_h', 'createElement', '$createElement'].includes(value.params[0]?.name));
  if (strong || renders) return true;
  // An `export default` object of a `.vue` file is the component; of a `.js` file it is one when it has two of the options.
  if (up?.type === 'ExportDefaultDeclaration') return info.isSfc ? entries.some(({ key }) => OPTION_KEYS.has(key)) : entries.filter(({ key }) => OPTION_KEYS.has(key)).length >= 2;
  return false;
}

/** Whether `node` is the global `Vue`: a binding of the default import of `vue`, or the name `Vue` with no binding of its own. */
function isVueRef(info, node) {
  if (node?.type === 'Identifier') return info.vueNames.has(node.name) || (node.name === 'Vue' && !info.bindings.has('Vue'));
  return isMember(node) && ['window', 'globalThis'].includes(node.object?.name) && memberName(node) === 'Vue';
}

const isVueSource = (source) => source === 'vue' || /^vue\/dist\//.test(source);

/** Whether a function node's own body uses `this` (arrow functions look through to the enclosing `this`). */
function usesThis(fn) {
  let found = false;
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node.type !== 'string' || found) return;
    if (node.type === 'ThisExpression') found = true;
    else if (node.type === 'ArrowFunctionExpression' || !isFunction(node)) {
      for (const [key, child] of Object.entries(node)) if (!NOT_CHILDREN.has(key) && child && typeof child === 'object') visit(child);
    }
  };
  visit(fn.body);
  return found;
}

/** Whether the value of a prop (`Array`, `{ type: Array }`, `{ type: [Array, Object] }`) says it is an array. */
function isArrayProp(value) {
  if (value?.type === 'Identifier') return value.name === 'Array';
  if (value?.type === 'ArrayExpression') return value.elements.some((element) => element?.type === 'Identifier' && element.name === 'Array');
  if (value?.type !== 'ObjectExpression') return false;
  const type = entriesOf(value).find(({ key }) => key === 'type');
  return type !== undefined && isArrayProp(type.value);
}

/** The objects a `data` function returns: its arrow body, or the `return` statements of its own body. */
function returnedObjects(fn) {
  if (fn.body.type !== 'BlockStatement') return fn.body.type === 'ObjectExpression' ? [fn.body] : [];
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node.type !== 'string' || isFunction(node)) return;
    if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression') found.push(node.argument);
    for (const [key, child] of Object.entries(node)) if (!NOT_CHILDREN.has(key) && child && typeof child === 'object') visit(child);
  };
  visit(fn.body.body);
  return found;
}

/** What a script declares, for the passes and for the files that import it. Read once per file. */
function infoOf(context, file) {
  if (context.infos.has(file)) return context.infos.get(file);
  const info = {
    file,
    bindings: new Map(),
    vueNames: new Set(),
    thisAliases: new Set(),
    ctors: new Set(),
    busNames: new Set(),
    busExports: new Map(),
    props: new Map(),
    data: new Map(),
    emits: null,
    model: null,
    components: new Map(),
    registered: new Set(),
    isSfc: file.endsWith('.vue'),
    globalComponents: [],
    name: null,
    watchers: [],
    mutations: new Map(),
    moduleConsts: new Map(),
    objects: new Map(),
    computed: new Map(),
    mixins: [],
    methods: new Set(),
    constants: new Map(),
    defaultObject: null,
    emittedNames: new Set(),
    hasOptions: false,
  };
  context.infos.set(file, info);
  const read = context.parsed.get(file);
  if (!read) return info;
  for (const block of read.blocks) readBlock(context, file, info, block);
  return info;
}

/** The component a binding or an `import()` names: `{ file }`, `{ package }`, or `{ inline: true }`; null when it cannot be told. */
function targetOf(context, file, info, node) {
  const fromSource = (source) => {
    const package_ = packageOf(source);
    if (package_ !== null) {
      // A package that the build config replaces by a file of ours is that file.
      const alias = aliasFor(context.aliases, source);
      if (alias !== null && alias.local && alias.key !== 'vue') {
        const base = posix.join(alias.to, source.slice(alias.key.length));
        const replaced = ['', '.vue', '.js', '/index.js', '/index.vue'].map((extension) => base + extension).find((path) => context.allFiles.has(path));
        if (replaced !== undefined) return { file: replaced, aliasOf: package_ };
      }
      return { package: package_ };
    }
    const target = isLocalPath(source) ? resolveImport(file, source, context.allFiles) : null;
    return target === null ? null : { file: target };
  };
  if (node?.type === 'Identifier') {
    const binding = info.bindings.get(node.name);
    if (binding !== undefined) return fromSource(binding.source);
    return info.moduleConsts.has(node.name) ? { inline: true, file, object: info.moduleConsts.get(node.name) } : null;
  }
  if (node?.type === 'ObjectExpression') return { inline: true, file, object: node };
  if (isFunction(node)) {
    let found = null;
    traverse(node.body, (inner) => {
      if (inner.type === 'CallExpression' && inner.callee.type === 'Import' && isString(inner.arguments[0])) found ??= fromSource(inner.arguments[0].value);
    });
    return found;
  }
  return null;
}

function readBlock(context, file, info, block) {
  const { program } = block.ast;
  const addBinding = (local, source, imported) => {
    info.bindings.set(local, { source, imported });
    if (isVueSource(source) && (imported === 'default' || imported === '*')) info.vueNames.add(local);
  };
  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers) {
        const imported = specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.type === 'ImportNamespaceSpecifier' ? '*' : (specifier.imported.name ?? specifier.imported.value);
        addBinding(specifier.local.name, node.source.value, imported);
      }
    } else if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        const init = declarator.init;
        if (declarator.id.type === 'Identifier' && isCall(init) && init.callee.type === 'Identifier' && init.callee.name === 'require' && isString(init.arguments[0])) {
          addBinding(declarator.id.name, init.arguments[0].value, 'default');
        }
        if (declarator.id.type === 'Identifier' && init?.type === 'ObjectExpression') info.moduleConsts.set(declarator.id.name, init);
        if (declarator.id.type === 'Identifier' && init) info.constants.set(declarator.id.name, init);
      }
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      for (const declarator of node.declaration.declarations) if (declarator.id.type === 'Identifier' && declarator.init) info.constants.set(declarator.id.name, declarator.init);
    }
  }
  const parents = new WeakMap();
  // First pass: what other facts are read through (aliases of this, constructors, buses, the names a component registers).
  traverse(program, (node, parent) => {
    parents.set(node, parent);
    if (isProperty(node) && keyName(node) === 'components' && valueOf(node).type === 'ObjectExpression') {
      for (const entry of entriesOf(valueOf(node))) if (entry.value.type === 'Identifier') info.registered.add(entry.value.name);
    } else if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'Identifier') {
      info.registered.add(node.declaration.name);
    } else if (isCall(node) && node.arguments[0]?.type === 'Identifier' && ((isMember(node.callee) && ['extend', 'component'].includes(memberName(node.callee))) || node.callee.type === 'Identifier')) {
      info.registered.add(node.arguments[0].name);
    } else if (isCall(node) && node.arguments[1]?.type === 'Identifier' && isMember(node.callee) && memberName(node.callee) === 'component') {
      info.registered.add(node.arguments[1].name);
    }
    // `install(Vue)` of a plugin takes the global Vue under any name.
    if ((isProperty(node) && keyName(node) === 'install' && isFunction(valueOf(node)) && valueOf(node).params[0]?.type === 'Identifier') || (node.type === 'AssignmentExpression' && isMember(node.left) && memberName(node.left) === 'install' && isFunction(node.right) && node.right.params[0]?.type === 'Identifier')) {
      info.vueNames.add((isProperty(node) ? valueOf(node) : node.right).params[0].name);
    }
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) {
      if (isVueRef(info, node.init)) info.vueNames.add(node.id.name);
      if (node.init.type === 'ThisExpression') info.thisAliases.add(node.id.name);
      if (isCall(node.init) && isMember(node.init.callee) && isVueRef(info, node.init.callee.object) && memberName(node.init.callee) === 'extend') info.ctors.add(node.id.name);
      if (node.init.type === 'NewExpression' && isVueRef(info, node.init.callee)) info.busNames.add(node.id.name);
    } else if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier' && node.right.type === 'ThisExpression') {
      info.thisAliases.add(node.left.name);
    }
  });
  const up = (node) => parents.get(node) ?? null;
  const thisLike = (node) => node?.type === 'ThisExpression' || (node?.type === 'Identifier' && info.thisAliases.has(node.name));
  /** `this.name` (or an alias) -> name. */
  const memberOfThis = (node) => (isMember(node) && thisLike(node.object) ? memberName(node) : null);
  const mutation = (name, node, how) => {
    if (name === null) return;
    if (!info.mutations.has(name)) info.mutations.set(name, []);
    info.mutations.get(name).push({ line: node.loc.start.line, how });
  };
  // What the module exports as a bus.
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'NewExpression' && isVueRef(info, node.declaration.callee)) info.busExports.set('default', 'default');
      else if (node.declaration.type === 'Identifier' && info.busNames.has(node.declaration.name)) info.busExports.set('default', node.declaration.name);
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      for (const declarator of node.declaration.declarations) {
        if (declarator.id.type === 'Identifier' && declarator.init?.type === 'NewExpression' && isVueRef(info, declarator.init.callee)) info.busExports.set(declarator.id.name, declarator.id.name);
      }
    }
  }
  for (const node of program.body) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    let declaration = node.declaration;
    if (isCall(declaration) && declaration.arguments[0]?.type === 'ObjectExpression') declaration = declaration.arguments[0];
    if (declaration.type === 'Identifier') declaration = info.moduleConsts.get(declaration.name) ?? null;
    if (declaration?.type === 'ObjectExpression') info.defaultObject = declaration;
  }
  traverse(program, (node) => {
    if (isCall(node) && isMember(node.callee)) {
      const method = memberName(node.callee);
      if (method === '$emit' && isString(node.arguments[0])) info.emittedNames.add(node.arguments[0].value);
      if (MUTATORS.has(method)) mutation(memberOfThis(node.callee.object), node, method);
      const [first] = node.arguments;
      if (['$set', '$delete'].includes(method) || (isVueRef(info, node.callee.object) && ['set', 'delete'].includes(method))) {
        mutation(memberOfThis(first), node, method.startsWith('$') ? method : `Vue.${method}`);
      }
    } else if (node.type === 'AssignmentExpression') {
      const { left } = node;
      if (isMember(left) && left.computed) mutation(memberOfThis(left.object), node, 'index assignment');
      else if (isMember(left) && memberName(left) === 'length') mutation(memberOfThis(left.object), node, 'length assignment');
    } else if (node.type === 'ObjectExpression' && isOptionsObject(info, up, node)) {
      readOptions(context, file, info, node);
    }
    if (isCall(node) && isMember(node.callee) && isVueRef(info, node.callee.object) && memberName(node.callee) === 'component' && isString(node.arguments[0]) && node.arguments[1]) {
      const target = node.arguments[1].type === 'ObjectExpression' ? { file } : targetOf(context, file, info, node.arguments[1]);
      if (target !== null) info.globalComponents.push({ key: toKey(node.arguments[0].value), target });
    }
  });
}

/** Reads the options object `object`: props, data, emits, model, components, name and watchers. */
function readOptions(context, file, info, object) {
  info.hasOptions = true;
  // What this object alone declares: a file can hold several components (a render-only one beside the default export).
  const own = { emits: null, props: new Set(), emitted: new Set() };
  info.objects.set(object, own);
  traverse(object, (node) => {
    if (isCall(node) && isMember(node.callee) && memberName(node.callee) === '$emit' && isString(node.arguments[0])) own.emitted.add(node.arguments[0].value);
  });
  for (const { key, value } of entriesOf(object)) {
    if (key === 'props') {
      if (value.type === 'ArrayExpression') {
        for (const element of value.elements) if (isString(element)) {
          info.props.set(element.value, { array: false });
          own.props.add(element.value);
        }
      } else if (value.type === 'ObjectExpression') {
        for (const prop of entriesOf(value)) if (prop.key !== null) {
          info.props.set(prop.key, { array: isArrayProp(prop.value) });
          own.props.add(prop.key);
        }
      }
    } else if (key === 'data' && isFunction(value)) {
      for (const returned of returnedObjects(value)) {
        for (const entry of entriesOf(returned)) {
          if (entry.key === null) continue;
          const isArray = entry.value.type === 'ArrayExpression' || (entry.value.type === 'NewExpression' && entry.value.callee.name === 'Array');
          info.data.set(entry.key, { kind: isArray ? 'array' : entry.value.type === 'ObjectExpression' ? 'object' : 'other', literal: entry.value.type === 'ObjectExpression' ? entry.value : null, node: entry.value, line: entry.property.loc.start.line });
        }
      }
    } else if (key === 'mixins' && value.type === 'ArrayExpression') {
      for (const element of value.elements) {
        const target = element?.type === 'Identifier' ? targetOf(context, file, info, element) : null;
        if (target?.file !== undefined) info.mixins.push(target);
      }
    } else if (key === 'data' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) if (entry.key !== null) info.data.set(entry.key, { kind: entry.value.type === 'ArrayExpression' ? 'array' : 'other', literal: entry.value.type === 'ObjectExpression' ? entry.value : null, node: entry.value });
    } else if (key === 'emits') {
      info.emits ??= new Set();
      own.emits ??= new Set();
      if (value.type === 'ArrayExpression') for (const element of value.elements) if (isString(element)) {
        info.emits.add(element.value);
        own.emits.add(element.value);
      }
      if (value.type === 'ObjectExpression') for (const entry of entriesOf(value)) if (entry.key !== null) {
        info.emits.add(entry.key);
        own.emits.add(entry.key);
      }
    } else if (key === 'model' && value.type === 'ObjectExpression') {
      const named = Object.fromEntries(entriesOf(value).map((entry) => [entry.key, stringOf(entry.value)]));
      info.model = { prop: named.prop ?? 'value', event: named.event ?? 'input' };
    } else if (key === 'name' && isString(value)) {
      info.name = value.value;
    } else if (key === 'components' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) {
        if (entry.key === null) continue;
        const target = targetOf(context, file, info, entry.property.shorthand ? entry.property.key : entry.value);
        if (target !== null) info.components.set(toKey(entry.key), target);
      }
    } else if (key === 'computed' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) {
        if (entry.key === null) continue;
        const getter = isFunction(entry.value) ? entry.value : entry.value.type === 'ObjectExpression' ? entriesOf(entry.value).find((inner) => inner.key === 'get')?.value : null;
        info.computed.set(entry.key, getter ?? null);
      }
    } else if (key === 'methods' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) if (entry.key !== null) info.methods.add(entry.key);
    } else if (key === 'watch' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) {
        if (entry.key === null || entry.key.includes('.')) continue;
        const deep = entry.value.type === 'ObjectExpression' && entriesOf(entry.value).some(({ key: inner, value: flag }) => inner === 'deep' && flag.type === 'BooleanLiteral' && flag.value);
        info.watchers.push({ name: entry.key, deep, line: entry.property.loc.start.line });
      }
    }
  }
}

/** What a component target is defined by: `{ file, object, own }`, `own` being what that options object declares (or null). */
function definitionOf(context, target) {
  if (target === null || target.package !== undefined) return null;
  const info = infoOf(context, target.file);
  const object = target.inline ? target.object : info.defaultObject;
  return { file: target.file, object, own: object ? (info.objects.get(object) ?? null) : null, info };
}

/**
 * The note of a `rootListener` hit for a listener `event` on a component, or null when the component declares it. `target` is
 * what the tag resolved to: null (nothing registers it), 'dynamic' (`<component :is>`), a package, or one of our definitions.
 */
function rootListenerNote(context, target, event) {
  if (target === 'dynamic') return 'dynamic component';
  if (target === null) return 'component not found';
  if (target.package !== undefined) return `package ${target.package}: its emits are not read`;
  const { file, own, info } = definitionOf(context, target);
  const declares = own?.emits?.has(event) || own?.props.has(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`);
  if (declares) return null;
  const emitted = own === null ? info.emittedNames.has(event) : own.emitted.has(event);
  return `${file}: ${own?.emits ? `emits does not list "${event}"` : 'no emits option'}${emitted ? `; it also $emits "${event}"` : ''}`;
}

/** The native event names that a literal `v-on` object (or `on: { ... }` of a render call) listens to. */
function nativeKeys(object) {
  return object?.type === 'ObjectExpression' ? entriesOf(object).map(({ key }) => key).filter((key) => key !== null && NATIVE_EVENTS.has(key)) : [];
}

// ---- the script pass: what is Vue 2 only ----------------------------------------------------------------------------------

/** The kind of array a watched name is, or null. */
function arrayKindOf(info, name) {
  if (info.data.get(name)?.kind === 'array') return 'data array';
  if (!info.data.has(name) && info.props.get(name)?.array) return 'prop array';
  return null;
}

/** An object with a `$on` of its own: a bus that is no Vue instance. */
const isEmitter = (object) => object?.type === 'ObjectExpression' && entriesOf(object).some(({ key }) => key === '$on');

/** What `$on`, `$off`, `$once` or `$emit` is called on, as a kind and a note. */
function receiverOf(env, node) {
  const { info } = env;
  const thisLike = (n) => n?.type === 'ThisExpression' || (n?.type === 'Identifier' && info.thisAliases.has(n.name));
  if (node === null || thisLike(node)) return { kind: 'component', note: 'on: the component' };
  if (node.type === 'Identifier' && ['$root', '$parent'].includes(node.name)) return { kind: node.name, note: `on: ${node.name}` };
  if (isMember(node)) {
    const name = memberName(node);
    if (['$root', '$parent'].includes(name)) return { kind: name, note: `on: ${name}` };
    if (isMember(node.object) && memberName(node.object) === '$refs') return { kind: 'ref', note: `on: a ref (${shorten(env.src(node))})` };
  }
  if (node.type === 'Identifier') {
    if (info.busNames.has(node.name)) return { kind: 'bus', note: `on: bus ${node.name} (new Vue() in this file)` };
    if (isEmitter(info.moduleConsts.get(node.name))) return { kind: 'emitter' };
    const binding = info.bindings.get(node.name);
    const target = binding !== undefined && isLocalPath(binding.source) ? resolveImport(env.file, binding.source, env.context.allFiles) : null;
    if (target !== null && infoOf(env.context, target).busExports.has(binding.imported === '*' ? 'default' : binding.imported)) {
      return { kind: 'bus', note: `on: bus ${node.name} (new Vue() in ${target})` };
    }
    if (target !== null && binding.imported === 'default' && isEmitter(infoOf(env.context, target).defaultObject)) return { kind: 'emitter' };
  }
  return { kind: 'other', note: 'on: other' };
}

/** The node a use of `node` is reported at: through the members and the call or assignment it is the start of. */
function usage(env, node) {
  let current = node;
  let parent = env.parent(current);
  while (isMember(parent) && parent.object === current) {
    current = parent;
    parent = env.parent(current);
  }
  if ((isCall(parent) && parent.callee === current) || (parent?.type === 'AssignmentExpression' && parent.left === current)) current = parent;
  return current;
}

/** A member of the global `Vue`. */
function vueMember(env, node, name) {
  const at = usage(env, node);
  const outer = env.parent(node);
  if (['set', 'delete'].includes(name)) env.add('setDelete', at);
  else if (name === 'extend') env.add('vueExtend', at);
  else if (name === 'observable') env.add('vueObservable', at);
  else if (VUE_REGISTER.has(name)) {
    env.add('vueRegister', at);
    const call = env.parent(node);
    const options = name === 'directive' && isCall(call) ? call.arguments[1] : null;
    if (options?.type === 'ObjectExpression') directiveHooks(env, call, isString(call.arguments[0]) ? call.arguments[0].value : '?', options);
    else if (name === 'directive' && isCall(call)) checkDirective(env, isString(call.arguments[0]) ? call.arguments[0].value : '?', call.arguments[1]);
    if (name === 'component' && isCall(call) && isFunction(call.arguments[1])) env.add('asyncComponent', call);
  } else if (name === 'nextTick') env.add('vueNextTick', at);
  else if (name === 'config') env.add(isMember(outer) && outer.object === node && memberName(outer) === 'keyCodes' ? 'keyCodes' : 'vueConfig', at);
  else if (name === 'prototype') env.add('vuePrototype', at);
  else env.add('vueOther', at);
}

/** A hit for the legacy hooks of a directive definition, at `node`. */
function directiveHooks(env, node, name, definition) {
  const legacy = entriesOf(definition).filter(({ key }) => LEGACY_DIRECTIVE_HOOKS.has(key)).map(({ key }) => key);
  if (legacy.length > 0) env.add('directiveHooks', node, `${name}: ${legacy.join(', ')}`);
}

/** A member `x.name` or, in a template, the bare `name` that starts with `$` or `_`: the instance members that are gone. */
function instanceMember(env, node, name, object) {
  const { info } = env;
  const thisLike = (n) => n === null || n?.type === 'ThisExpression' || (n?.type === 'Identifier' && (info.thisAliases.has(n.name) || ['$root', '$parent'].includes(n.name))) || (isMember(n) && ['$root', '$parent'].includes(memberName(n)));
  const at = usage(env, node);
  if (name === '$set' || name === '$delete') env.add('setDelete', at);
  else if (name === '$on' || name === '$off' || name === '$once') {
    const receiver = receiverOf(env, object);
    if (receiver.kind !== 'emitter') env.add('eventBus', at, undefined, { note: receiver.note });
    const call = env.parent(node);
    if (isCall(call) && call.callee === node && stringOf(call.arguments[0])?.startsWith('hook:')) env.add('hookEvents', call);
  } else if (name === '$emit') {
    const receiver = receiverOf(env, object);
    if (!['component', 'emitter'].includes(receiver.kind)) env.add('emitOnOther', at, undefined, { note: receiver.note });
  } else if (name === '$children') env.add('children', at);
  else if (name === '$listeners') env.add('listeners', at);
  else if (name === '$scopedSlots') env.add('scopedSlots', at);
  else if (name === '$destroy' || name === '$mount') env.add('destroyMount', at);
  else if (REMOVED_INTERNALS.has(name) || (REMOVED_PRIVATES.has(name) && thisLike(object))) env.add('removedInternals', at);
  else if (name === '$parent' && memberName(object ?? {}) !== '$parent') {
    let depth = 1;
    for (let current = node, up = env.parent(current); isMember(up) && up.object === current && memberName(up) === '$parent'; current = up, up = env.parent(current)) depth++;
    env.add('parentAccess', at, undefined, { note: `depth ${depth}` });
  }
  else if (name === '$attrs') env.add('attrsUse', at);
  else if (name === '$slots') env.add('slotsAccess', at);
  else if (name === '$bvModal' || name === '$bvToast') {
    env.add('bvInstance', at);
    recordBvCall(env, at);
  }
  else if (name === '$refs' && (object === null || object.type === 'ThisExpression' || (object.type === 'Identifier' && info.thisAliases.has(object.name)))) refAccess(env, node);
}

/** `this.$refs.name.member` (or `$refs.name.member` in a template): noted for the pass that knows what the ref is. */
function refAccess(env, node) {
  let current = node;
  let parent = env.parent(current);
  if (!(isMember(parent) && parent.object === current)) return;
  const name = memberName(parent);
  current = parent;
  parent = env.parent(current);
  if (isMember(parent) && parent.object === current && parent.computed && stringOf(parent.property) === null) {
    current = parent;
    parent = env.parent(current);
  }
  let member = null;
  if (isMember(parent) && parent.object === current) {
    member = memberName(parent);
    current = parent;
  }
  const at = usage(env, current);
  env.refAccesses.push({ name, member, line: at.loc.start.line, text: env.where === 'template' ? env.holder() : shorten(env.src(at)) });
}

/** Whether `node` is inside a `render` option, where `h` is the render function's own. */
function insideRender(env, node) {
  for (let up = env.parent(node); up; up = env.parent(up)) if (isProperty(up) && keyName(up) === 'render') return true;
  return false;
}

/** `h(x)`, `createElement(x)` and `this.$createElement(x)`: a component or an element made by hand, read when its name is a string. */
function renderCall(env, node) {
  const { callee } = node;
  const [first] = node.arguments;
  if (first === undefined || env.where !== 'script') return;
  const named = callee.type === 'Identifier' ? callee.name : isMember(callee) ? memberName(callee) : null;
  const isRender = named === 'createElement' || named === '$createElement' || (named === 'h' && callee.type === 'Identifier' && (env.info.bindings.get('h')?.source === 'vue' || insideRender(env, node)));
  if (!isRender) return;
  const name = stringOf(first);
  if (name === null) {
    const target = first.type === 'Identifier' ? targetOf(env.context, env.file, env.info, first) : null;
    if (target === null) env.add('dynamicComponent', node);
    const data = node.arguments[1];
    if (target !== null && data?.type === 'ObjectExpression') {
      // Vue 2's data object `{ on: { change } }`, and Vue 3's flat `{ onChange }`.
      const events = [
        ...nativeKeys(entriesOf(data).find((entry) => entry.key === 'on')?.value),
        ...entriesOf(data).map(({ key }) => (/^on[A-Z]/.test(key ?? '') ? key.charAt(2).toLowerCase() + key.slice(3) : null)).filter((event) => event !== null && NATIVE_EVENTS.has(event)),
      ];
      for (const event of events) {
        const note = rootListenerNote(env.context, target, event);
        if (note !== null) env.add('rootListener', node, undefined, { note });
      }
    }
  } else if (BV_TAG.test(name)) noteBvRenderCall(env, node, name);
}

const ITEM_KEYS = new Set(['_showDetails', '_rowVariant', '_cellVariants']);

/** A use of a special key of a `b-table` item (`_showDetails`...), as a property, a member or a string. */
function noteItemKeys(env, node) {
  let key = null;
  let how = null;
  if (isProperty(node) && ITEM_KEYS.has(keyName(node))) [key, how] = [keyName(node), 'property'];
  else if (isMember(node) && ITEM_KEYS.has(memberName(node))) [key, how] = [memberName(node), 'member'];
  else if (isString(node) && ITEM_KEYS.has(node.value)) {
    const parent = env.parent(node);
    if (!(isProperty(parent) && parent.key === node && !parent.computed) && parent?.type !== 'ImportDeclaration') [key, how] = [node.value, 'string'];
  }
  if (key !== null) noteItemKey(env.context, env.file, key, how);
}

function noteItemKey(context, file, key, how) {
  const record = addTo(context.itemKeys, key, () => ({ key, uses: 0, how: new Set(), files: new Set() }));
  record.uses++;
  record.how.add(how);
  record.files.add(file);
}

/** A call of `$bvToast`, `$bvModal` or a `bv::` event: its arguments, and the whole text of every option. */
function recordBvCall(env, call) {
  if (!isCall(call)) return;
  const args = [];
  let options = null;
  for (const argument of call.arguments) {
    if (argument.type === 'ObjectExpression' && options === null) {
      options = argument.properties.map((property) =>
        property.type === 'SpreadElement' || property.type === 'SpreadProperty'
          ? { key: '...', value: oneLine(env.src(property.argument)) }
          : { key: keyName(property) ?? `[${oneLine(env.src(property.key))}]`, value: oneLine(env.src(property.type === 'ObjectMethod' ? property : property.value)) },
      );
    } else {
      args.push(oneLine(env.src(argument)));
    }
  }
  env.context.bvCalls.push({ file: env.file, line: call.loc.start.line, call: oneLine(env.src(call.callee)), args, options });
}

const BV_SELECTOR = /(^|[\s,>+~[(])[a-z]*\.(?:b|bv)-[a-z]|__BVID__/;

/** The checks that apply to one node of a script or of a template expression (the shapes of Babel and ESTree are alike). */
function inspect(env, node) {
  const { info } = env;
  noteItemKeys(env, node);
  if (isMember(node)) {
    const name = memberName(node);
    if (name === null) return;
    if (isVueRef(info, node.object)) vueMember(env, node, name);
    else if (name.startsWith('$') || name.startsWith('_')) instanceMember(env, node, name, node.object);
  } else if (node.type === 'Identifier' && env.where === 'template' && node.name.startsWith('$')) {
    const parent = env.parent(node);
    const isProperty_ = (isMember(parent) && parent.property === node && !parent.computed) || (isProperty(parent) && parent.key === node && !parent.computed);
    if (!isProperty_) instanceMember(env, node, node.name, null);
  } else if (isCall(node)) {
    const { callee } = node;
    const [first] = node.arguments;
    // `this.$emit(...)` in a script, `$emit(...)` in a template.
    const emitter = isMember(callee) ? (memberName(callee) === '$emit' ? callee.object : undefined) : env.where === 'template' && callee.type === 'Identifier' && callee.name === '$emit' ? null : undefined;
    if (emitter !== undefined && stringOf(first) !== null && receiverOf(env, emitter).kind === 'component') {
      const event = stringOf(first);
      if (event === 'input') env.add('emitInput', node);
      if (NATIVE_EVENTS.has(event) && !info.emits?.has(event)) {
        env.add('emitsMissing', node, undefined, { note: info.emits === null ? 'no emits option' : `emits does not list "${event}"` });
      }
    }
    renderCall(env, node);
    if (callee.type === 'Identifier' && callee.name === 'require' && isString(first)) {
      if (first.value === 'vue') env.add('vueImport', node);
      if (first.value === 'bootstrap-vue' || first.value.startsWith('bootstrap-vue/')) env.add('bvImports', node);
    }
  } else if (node.type === 'NewExpression') {
    const { callee } = node;
    if (isVueRef(info, callee) || (callee.type === 'Identifier' && info.ctors.has(callee.name))) env.add('newVue', node);
  } else if (isString(node) || node.type === 'TemplateLiteral') {
    const parent = env.parent(node);
    if (parent?.type === 'ImportDeclaration' || parent?.type === 'ExportNamedDeclaration' || parent?.type === 'ExportAllDeclaration') return;
    const text = node.type === 'TemplateLiteral' ? node.quasis.map((quasi) => quasi.value.cooked).join('${}') : node.value;
    if (text.startsWith('bv::')) {
      env.add('bvInstance', node);
      const call = env.parent(node);
      if (isCall(call) && call.arguments[0] === node && isMember(call.callee)) recordBvCall(env, call);
    } else if (env.where === 'script' && BV_SELECTOR.test(text)) env.add('bvDomQuery', node);
  } else if (node.type === 'JSXElement') {
    for (let up = env.parent(node); up; up = env.parent(up)) if (up.type === 'JSXElement' || up.type === 'JSXFragment') return;
    env.add('renderFunction', node);
  }
}

/** The checks on the options object `object`: what a component declares that Vue 3 reads differently or not at all. */
function inspectOptions(env, object) {
  for (const { key, property, value } of entriesOf(object)) {
    if ((key === 'beforeDestroy' || key === 'destroyed') && plausible(key, value)) env.add('destroyHooks', property);
    else if (key === 'filters' && value.type === 'ObjectExpression') env.add('filtersOption', property);
    else if (key === 'model' && value.type === 'ObjectExpression') env.add('modelOption', property);
    else if (key === 'functional') env.add('functional', property);
    else if (key === 'render' && isFunction(value) && value.params.length > 0) env.add('renderFunction', property);
    else if (key === 'data' && value.type === 'ObjectExpression') env.add('dataObject', property);
    else if (key === 'inheritAttrs' && value.type === 'BooleanLiteral' && !value.value) env.add('inheritAttrs', property);
    else if (key === 'directives' && value.type === 'ObjectExpression') {
      for (const directive of entriesOf(value)) {
        if (directive.value.type === 'ObjectExpression') directiveHooks(env, directive.property, directive.key ?? '?', directive.value);
        else checkDirective(env, directive.key ?? '?', directive.value);
      }
    } else if (key === 'components' && value.type === 'ObjectExpression') {
      for (const entry of entriesOf(value)) if (isFunction(entry.value)) env.add('asyncComponent', entry.property);
    } else if (key === 'props' && value.type === 'ObjectExpression') {
      for (const prop of entriesOf(value)) {
        if (prop.value.type !== 'ObjectExpression') continue;
        const fallback = entriesOf(prop.value).find((entry) => entry.key === 'default');
        if (fallback !== undefined && isFunction(fallback.value) && usesThis(fallback.value)) env.add('propDefaultThis', fallback.property, `${prop.key}: ${env.src(fallback.property)}`);
      }
    }
  }
}

/** The keys of the object that a `data()` function returns whose value is an object. */
function dataObjectKeys(object) {
  const found = new Set();
  const data = object ? entriesOf(object).find((entry) => entry.key === 'data' && isFunction(entry.value)) : undefined;
  if (data) for (const returned of returnedObjects(data.value)) for (const entry of entriesOf(returned)) if (entry.key !== null && entry.value.type === 'ObjectExpression') found.add(entry.key);
  return found;
}

/** A `data` key that is an object here and in a mixin: Vue 2 merges the two, Vue 3 keeps this one. */
function dataMergeNotes(context, file, info) {
  for (const mixin of info.mixins) {
    const theirs = dataObjectKeys(infoOf(context, mixin.file).defaultObject);
    for (const [key, own] of info.data) {
      if (own.kind === 'object' && theirs.has(key)) context.add('dataMerge', file, own.line ?? 1, key, { note: `object in both: Vue 2 merges them, Vue 3 keeps the component's; the mixin is ${mixin.file}` });
    }
  }
}

/** A directive definition that is not written in place: a constant of the file, or the default export of a file it imports. */
function checkDirective(env, name, value) {
  if (value?.type !== 'Identifier') return;
  const { info, context } = env;
  const local = info.moduleConsts.get(value.name);
  const binding = info.bindings.get(value.name);
  const target = binding !== undefined && isLocalPath(binding.source) ? resolveImport(env.file, binding.source, context.allFiles) : null;
  const where = local ? { file: env.file, object: local } : target !== null ? { file: target, object: infoOf(context, target).defaultObject } : null;
  if (where?.object?.type !== 'ObjectExpression') return;
  const legacy = entriesOf(where.object).filter(({ key }) => LEGACY_DIRECTIVE_HOOKS.has(key)).map(({ key }) => key);
  const line = where.object.loc.start.line;
  if (legacy.length > 0 && !context.directiveSeen.has(`${where.file}:${line}`)) {
    context.directiveSeen.add(`${where.file}:${line}`);
    context.add('directiveHooks', where.file, line, `${name}: ${legacy.join(', ')}`);
  }
}

/** The watchers of arrays without `deep`, with whether the file changes the array in place. */
function watchNotes(context, file, info) {
  for (const watcher of info.watchers) {
    const kind = arrayKindOf(info, watcher.name);
    if (kind === null || watcher.deep) continue;
    const changes = info.mutations.get(watcher.name) ?? [];
    const note = changes.length === 0 ? 'no in-place change seen in this file' : `changed in place at line ${changes.map(({ line, how }) => `${line} (${how})`).join(', ')}`;
    context.add('watchArrays', file, watcher.line, `watch ${watcher.name} (${kind}, no deep)`, { note });
  }
}

/** The environment of a pass over one script block: how to read a node, and where hits go. */
function scriptEnv(context, file, info, block, parents) {
  const env = {
    context,
    file,
    info,
    where: 'script',
    refAccesses: [],
    parent: (node) => parents.get(node) ?? null,
    src: (node) => block.text.slice(node.start, node.end),
    add: (kind, node, text, extra) => context.add(kind, file, node.loc.start.line, text ?? block.text.slice(node.start, node.end), extra),
  };
  return env;
}

/** Scans the script blocks of a file. Returns the `$refs` accesses it found, for the pass that knows what the refs are. */
function scanScripts(context, file, read, info) {
  const refAccesses = [];
  for (const block of read.blocks) {
    const parents = new WeakMap();
    const env = scriptEnv(context, file, info, block, parents);
    env.refAccesses = refAccesses;
    traverse(block.ast.program, (node, parent) => {
      parents.set(node, parent);
      inspect(env, node);
      if (node.type === 'ImportDeclaration') inspectImport(env, node);
      else if (node.type === 'ObjectExpression' && isOptionsObject(info, env.parent, node)) inspectOptions(env, node);
    });
  }
  return refAccesses;
}

/** An import: the default `Vue` of `vue`, `set` and `del` of it, and everything of `bootstrap-vue`. */
function inspectImport(env, node) {
  const source = node.source.value;
  const isDefault = node.specifiers.some((specifier) => specifier.type === 'ImportDefaultSpecifier');
  if (isVueSource(source) && isDefault) env.add('vueImport', node);
  if (source === 'vue' && node.specifiers.some((specifier) => ['set', 'del'].includes(specifier.imported?.name ?? specifier.imported?.value))) env.add('setDelete', node);
  if (source === 'bootstrap-vue' || source.startsWith('bootstrap-vue/')) env.add('bvImports', node);
}


// ---- the template pass ----------------------------------------------------------------------------------------------------

const BV_TAG = /^b-[a-z]/;
const BV_PASCAL = /^B[A-Z][a-z]/;

/** Every `.vue` file's global component registrations (`Vue.component(...)`), by key: what a tag finds when the file does not register it. */
function globalComponents(context) {
  if (!context.globals) {
    context.globals = new Map();
    for (const file of context.files) for (const { key, target } of infoOf(context, file).globalComponents) if (!context.globals.has(key)) context.globals.set(key, target);
  }
  return context.globals;
}

/** What a tag names: `{ file }`, `{ package }`, `{ inline }`, or null when nothing registers it. */
function resolveTag(context, file, info, tag) {
  const key = toKey(tag);
  if (info.components.has(key)) return info.components.get(key);
  if (info.name !== null && toKey(info.name) === key) return { file };
  return globalComponents(context).get(key) ?? null;
}

/** The kebab-case name of a BootstrapVue tag, or null when the tag is not one (an own component of that name is not). */
function bvName(context, file, info, tag) {
  if (!BV_TAG.test(tag) && !BV_PASCAL.test(tag)) return null;
  const target = resolveTag(context, file, info, tag);
  if (target !== null && (target.file !== undefined || target.inline)) return null;
  return toKebab(tag);
}

/** The nodes a template renders at its root: elements (a `v-else` branch belongs to the chain before it) and text. */
function rootNodes(body) {
  return (body?.children ?? []).filter((child) => {
    if (child.type === 'VElement') return !child.startTag.attributes.some((attr) => attr.directive && ['else', 'else-if'].includes(attr.key.name.name));
    return child.type === 'VExpressionContainer' || (child.type === 'VText' && child.value.trim() !== '');
  });
}

/** The line a node's first visible character is on (a text node starts at the whitespace before its text). */
function firstLine(node) {
  if (node.type !== 'VText') return node.loc.start.line;
  const lead = node.value.length - node.value.trimStart().length;
  return node.loc.start.line + (node.value.slice(0, lead).match(/\n/g) ?? []).length;
}

/** `{ attr, text, ... }` for an attribute: how it is written, and what it is. */
function describe(attr, source) {
  const text = source.slice(attr.range[0], attr.range[1]);
  if (!attr.directive) {
    return { attr, text, directive: false, name: attr.key.rawName, lower: attr.key.name, value: attr.value ? attr.value.value : null, line: attr.loc.start.line };
  }
  const { argument } = attr.key;
  return {
    attr,
    text,
    directive: true,
    dir: attr.key.name.name,
    raw: attr.key.name.rawName,
    arg: argument?.type === 'VIdentifier' ? argument.rawName : null,
    dynamicArg: argument?.type === 'VExpressionContainer',
    mods: attr.key.modifiers.map((modifier) => modifier.name),
    container: attr.value,
    expression: attr.value?.expression ?? null,
    line: attr.loc.start.line,
  };
}

const isBind = (a, name) => a.directive && a.dir === 'bind' && (name === undefined || a.arg === name);
/** An attribute that is `name="..."` or `:name="..."`. */
const isAttr = (a, name) => (!a.directive && a.lower === name) || isBind(a, name);
const startTagLabel = (el, used) => `<${el.rawName}${used.map((a) => ` ${a.text}`).join('')}>`;

/** Whether the literal text of a bound value is a string or a number, which no attribute coercion changes. */
function isPlainLiteral(expression) {
  if (expression === null) return false;
  if (expression.type === 'Literal') return typeof expression.value === 'string' || typeof expression.value === 'number';
  return expression.type === 'TemplateLiteral' && expression.expressions.length === 0;
}

const COMPARISONS = new Set(['==', '===', '!=', '!==', '<', '>', '<=', '>=', 'in', 'instanceof']);
const STRING_METHODS = new Set(['toString', 'join', 'toFixed', 'toLocaleString', 'toLowerCase', 'toUpperCase', 'trim', 'concat', 'replace']);

/** Whether the value of a bound expression can be `false` (what Vue 2 removed and Vue 3 keeps): not when it is always a string, a number or null. */
function mayBeFalse(node) {
  switch (node?.type) {
    case 'Literal': return node.value === false;
    case 'TemplateLiteral': return false;
    case 'ConditionalExpression': return mayBeFalse(node.consequent) || mayBeFalse(node.alternate);
    case 'LogicalExpression': return node.operator === '||' ? mayBeFalse(node.right) : mayBeFalse(node.left) || mayBeFalse(node.right);
    case 'BinaryExpression': return COMPARISONS.has(node.operator);
    case 'UnaryExpression': return node.operator === '!';
    case 'Identifier': return node.name !== 'undefined';
    case 'CallExpression':
      if (node.callee.type === 'Identifier') return !['String', 'Number', 'parseInt', 'parseFloat'].includes(node.callee.name);
      return !(node.callee.type === 'MemberExpression' && STRING_METHODS.has(memberName(node.callee)));
    default: return true;
  }
}

/** How a bound attribute differs on Vue 3, as the note of an `attrCoercion` hit, or null when it does not. */
function coercionNote(a, tag) {
  const name = a.arg.toLowerCase();
  const literalFalse = a.expression?.type === 'Literal' && a.expression.value === false;
  if (name === 'checked') return tag === 'input' ? null : `checked on a <${tag}>: an attribute there, not a property`;
  if (ENUMERATED_ATTRIBUTES.has(name)) {
    return isPlainLiteral(a.expression) || (a.expression?.type === 'Literal' && a.expression.value === true) ? null : 'enumerated attribute: null and undefined remove it on Vue 3 (Vue 2 wrote "false")';
  }
  if (!mayBeFalse(a.expression)) return null;
  const kind = name.startsWith('aria-') ? 'aria-*' : name.startsWith('data-') ? 'data-*' : KNOWN_ATTRIBUTES.has(name) ? null : 'unknown attribute';
  if (kind === null) return null;
  return literalFalse ? `${kind}: bound to false (kept as "false" on Vue 3)` : `${kind}: false is kept as "false" on Vue 3`;
}

/** What a component's `v-model` is, from the file that defines it. */
const VUE3_CONTRACT = ': modelValue + update:modelValue';
function contractOf(context, target) {
  if (target === null) return 'component not found';
  if (target.package !== undefined) return `package ${target.package}`;
  if (target.inline) return 'a component written in place';
  const child = infoOf(context, target.file);
  if (child.model !== null) return `${target.file}: ${child.model.prop} + ${child.model.event} (model option)`;
  if (child.props.has('modelValue')) return `${target.file}${VUE3_CONTRACT}`;
  if (child.props.has('value')) return `${target.file}: value + input (Vue 2 contract)`;
  return `${target.file}: no value or modelValue prop`;
}

/** The attributes that a parent passes to a component with several roots, and that the component does not take as props or emits. */
function extraneous(context, childFile, attrs) {
  const child = infoOf(context, childFile);
  const props = new Set([...child.props.keys()].map(toKebab));
  const events = new Set([...(child.emits ?? [])]);
  const found = [];
  for (const a of attrs) {
    if (!a.directive) {
      if (['class', 'style'].includes(a.lower) || !(['ref', 'key', 'is', 'slot', 'slot-scope', 'inline-template'].includes(a.lower) || props.has(toKebab(a.name)))) found.push({ a, label: a.name });
    } else if (a.dir === 'bind' && a.arg !== null) {
      if (['class', 'style'].includes(a.arg) || !(['ref', 'key', 'is', 'slot'].includes(a.arg) || props.has(toKebab(a.arg)))) found.push({ a, label: `:${a.arg}` });
    } else if (a.dir === 'on' && a.arg !== null && !events.has(a.arg) && !a.arg.startsWith('update:') && !a.arg.startsWith('hook:')) {
      found.push({ a, label: `@${a.arg}` });
    }
  }
  return found;
}

/** Reads a template: every pattern in it, and what its refs are. Returns the refs by name. */
function scanTemplate(context, file, read, info) {
  const { body, source } = read;
  const refs = new Map();
  const refAccesses = [];
  if (!body) return { refs, refAccesses };
  const env = {
    context,
    file,
    info,
    source,
    where: 'template',
    refAccesses,
    holder: () => '',
    parent: (node) => node.parent ?? null,
    src: (node) => source.slice(node.range[0], node.range[1]),
    add: (kind, node, text, extra) => context.add(kind, file, node.loc.start.line, text ?? env.holder(), extra),
  };
  const expression = (container, holder) => {
    if (!container?.expression) return;
    env.holder = holder;
    vueEslintParser.AST.traverseNodes(container, {
      enterNode(node) {
        if (node.type === 'VFilterSequenceExpression') env.add('templateFilters', node);
        else inspect(env, node);
      },
      leaveNode() {},
    });
  };

  for (const a of body.startTag.attributes.map((attr) => describe(attr, source))) {
    if (!a.directive && a.lower === 'functional') context.add('functionalTemplate', file, a.line, startTagLabel(body, body.startTag.attributes.map((attr) => describe(attr, source))));
  }
  const roots = rootNodes(body);
  if (roots.length > 1) context.add('multiRoot', file, firstLine(roots[0]), `${roots.length} root nodes`);

  const visit = (el, scope) => {
    const tag = el.rawName;
    const lower = tag.toLowerCase();
    const kebab = toKebab(tag);
    const attrs = el.startTag.attributes.map((attr) => describe(attr, source));
    const isNative = HTML_TAGS.has(lower) && !BUILT_IN_TAGS.has(lower);
    const inSvg = scope.inSvg || tag === 'svg';
    const isSvg = inSvg || SVG_TAGS.has(tag);
    const isBuiltIn = BUILT_IN_TAGS.has(lower) || BUILT_IN_TAGS.has(kebab);
    const isComponent = !isNative && !isSvg && !isBuiltIn;
    const bv = bvName(context, file, info, tag);
    const hit = (kind, used, extra) => context.add(kind, file, used[0]?.line ?? el.loc.start.line, startTagLabel(el, used), extra);
    const forAttr = attrs.find((a) => a.directive && a.dir === 'for');
    const inFor = forAttr ? forAttr.text : scope.inFor;

    for (const a of attrs) {
      if (a.directive) {
        if (a.dir === 'on' && a.mods.includes('native')) hit('native', [a]);
        if (a.dir === 'bind' && a.mods.includes('sync')) hit('sync', [a]);
        if (a.dir === 'on' && a.mods.some((modifier) => /^\d+$/.test(modifier))) hit('keyCodeModifier', [a]);
        if (a.dir === 'on' && a.arg?.startsWith('hook:')) hit('hookEvents', [a]);
        if (a.dir === 'on' && (isComponent || tag === 'component') && !bv) {
          const target = tag === 'component' ? 'dynamic' : resolveTag(context, file, info, tag);
          const events = a.arg !== null ? (NATIVE_EVENTS.has(a.arg) && !a.mods.includes('native') ? [a.arg] : []) : nativeKeys(a.expression);
          for (const event of events) {
            const note = rootListenerNote(context, target, event);
            if (note !== null) hit('rootListener', tag === 'component' && a.arg !== null ? [...attrs.filter((other) => isAttr(other, 'is')), a].sort((x, y) => x.attr.range[0] - y.attr.range[0]) : [a], { note });
          }
        }
        if (a.dir === 'on' && a.arg?.startsWith('bv::')) hit('bvInstance', [a]);
        if (isBind(a, 'slot') || isBind(a, 'slot-scope') || a.dir === 'slot-scope') hit('oldSlotSyntax', [a]);
        if (a.dir === 'model' && isComponent && !bv && tag !== 'component') {
          const note = contractOf(context, resolveTag(context, file, info, tag));
          if (!note.endsWith(VUE3_CONTRACT)) hit('vModelComponent', [a], { note });
        } else if (a.dir === 'model' && tag === 'component') {
          hit('vModelComponent', [...attrs.filter((other) => isAttr(other, 'is')), a].sort((x, y) => x.attr.range[0] - y.attr.range[0]), { note: 'dynamic component' });
        }
      } else {
        if (a.lower === 'slot' || a.lower === 'slot-scope') hit('oldSlotSyntax', [a]);
        if (a.lower === 'inline-template') hit('inlineTemplate', [a]);
      }
      if (['enter-class', 'leave-class'].includes(a.directive ? (a.dir === 'bind' ? a.arg : null) : a.lower) && ['transition', 'transition-group'].includes(kebab)) hit('transitionClasses', [a]);
      if (lower === 'component' && isBind(a, 'is') && stringLeaves(a.expression) === null) hit('dynamicComponent', [a]);
      if (isAttr(a, 'is') && isNative && lower !== 'component') {
        const value = a.directive ? stringOf(a.expression) : a.value;
        if (!String(value ?? '').startsWith('vue:')) hit('isOnElement', [a]);
      }
      if (isAttr(a, 'ref') && inFor !== null && !(a.directive && ['ArrowFunctionExpression', 'FunctionExpression'].includes(a.expression?.type))) {
        hit('vForRef', [a], { note: `inside ${inFor}` });
      }
      if (isBind(a) && a.arg !== null && isNative && !isSvg && !a.mods.includes('prop')) {
        const note = coercionNote(a, lower);
        if (note !== null) hit('attrCoercion', [a], { note });
      }
      expression(a.container, () => startTagLabel(el, [a]));
    }

    if (lower === 'template' && el !== body && !attrs.some((a) => (a.directive && ['if', 'else-if', 'else', 'for', 'slot', 'slot-scope'].includes(a.dir)) || (!a.directive && ['slot', 'slot-scope'].includes(a.lower)))) {
      hit('templateNoDirective', []);
    }
    if (forAttr && attrs.some((a) => a.directive && ['if', 'else-if', 'else'].includes(a.dir))) {
      hit('ifWithFor', attrs.filter((a) => a.directive && ['for', 'if', 'else-if', 'else'].includes(a.dir)).sort((a, b) => a.attr.range[0] - b.attr.range[0]));
    }
    // On a `<slot>` the object is the slot's props, not attributes.
    const objects = lower === 'slot' ? [] : attrs.filter((a) => isBind(a) && a.arg === null && !a.dynamicArg && !(a.expression?.type === 'Identifier' && a.expression.name === '$listeners'));
    for (const object of objects) {
      const before = attrs.filter((a) => a.attr.range[0] < object.attr.range[0] && ((!a.directive && !['ref', 'key'].includes(a.lower)) || (isBind(a) && a.arg !== null && !['ref', 'key'].includes(a.arg))));
      if (before.length > 0) hit('bindObjectOrder', [...before, object].sort((a, b) => a.attr.range[0] - b.attr.range[0]));
    }
    if (kebab === 'transition-group' && !attrs.some((a) => isAttr(a, 'tag'))) hit('transitionGroupTag', attrs);

    const target = isComponent ? resolveTag(context, file, info, tag) : null;
    if (target?.file !== undefined && target.file !== file && context.parsed.get(target.file)?.body && rootNodes(context.parsed.get(target.file).body).length > 1) {
      const child = context.parsed.get(target.file);
      const passed = /\$attrs/.test(child.source.slice(child.body.range[0], child.body.range[1])) ? [] : extraneous(context, target.file, attrs);
      if (passed.length > 0) hit('fallthroughMultiRoot', passed.map(({ a }) => a), { note: `${target.file} has several roots; ${passed.map(({ label }) => label).join(', ')} are not props or emits` });
    }

    for (const a of attrs) {
      if (isAttr(a, 'ref') && !a.directive && a.value !== null) {
        if (!refs.has(a.value)) refs.set(a.value, []);
        refs.get(a.value).push({ tag: bv ?? tag, bv: bv !== null, line: a.line, inFor: inFor !== null });
      }
    }
    recordBootstrap(context, file, info, env, el, tag, bv, attrs);

    for (const child of el.children) {
      if (child.type === 'VExpressionContainer') expression(child, () => shorten(source.slice(child.range[0], child.range[1])));
      else if (child.type === 'VElement') visit(child, { inFor, inSvg });
    }
  };
  for (const child of body.children) {
    if (child.type === 'VExpressionContainer') expression(child, () => shorten(source.slice(child.range[0], child.range[1])));
    else if (child.type === 'VElement') visit(child, { inFor: null, inSvg: false });
  }
  return { refs, refAccesses };
}

// ---- BootstrapVue: the tags, the directives, the refs ------------------------------------------------------------------------

/** The entry of a tag in the table of what BootstrapVue components are used with. */
function bvEntry(context, tag) {
  if (!context.bvTags.has(tag)) {
    context.bvTags.set(tag, {
      tag,
      uses: 0,
      files: new Map(),
      spellings: new Set(),
      props: new Map(),
      fieldKeys: new Map(),
      fieldDefinitions: 0,
      fieldStrings: 0,
      events: new Map(),
      models: new Map(),
      slots: new Map(),
      refs: new Map(),
      directives: new Map(),
      fallthrough: { class: 0, style: 0, id: 0, attrs: 0, nativeListeners: 0 },
      ids: new Set(),
      dynamic: [],
    });
  }
  return context.bvTags.get(tag);
}

const addTo = (map, key, make) => {
  if (!map.has(key)) map.set(key, make());
  return map.get(key);
};

/** The strings an expression can be, when every way it can end is a string (`a ? 'x' : 'y'`), else null. */
function stringLeaves(node) {
  if (node?.type === 'ConditionalExpression') {
    const [yes, no] = [stringLeaves(node.consequent), stringLeaves(node.alternate)];
    return yes === null || no === null ? null : [...yes, ...no];
  }
  const text = stringOf(node);
  return text === null ? null : [text];
}

/** The name of the BootstrapVue component `<component is="b-x">` or `:is="'b-x'"` names, or null. */
function bvThroughIs(attrs) {
  for (const a of attrs) {
    if (!isAttr(a, 'is')) continue;
    const values = a.directive ? (stringLeaves(a.expression) ?? []) : [a.value];
    const found = values.find((value) => typeof value === 'string' && BV_TAG.test(value));
    if (found !== undefined) return found;
  }
  return null;
}

/** What a slot's props are called: the keys of a destructured parameter, or the members of the parameter a template uses. */
function slotScope(element, attr) {
  const params = attr?.expression?.params ?? [];
  const names = new Set();
  for (const param of params) {
    if (param.type === 'ObjectPattern') {
      for (const property of param.properties) {
        if (property.type === 'Property') names.add(keyName(property) ?? '[computed]');
        else names.add(`...${property.argument?.name ?? ''}`);
      }
    } else if (param.type === 'Identifier') {
      vueEslintParser.AST.traverseNodes(element, {
        enterNode(node) {
          if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.object.name === param.name && memberName(node) !== null) names.add(memberName(node));
        },
        leaveNode() {},
      });
    }
  }
  return [...names].sort(byCodeUnit);
}

/** The slots a BootstrapVue element fills, from its children and from a `v-slot` on the element itself. */
function recordSlots(entry, file, el, attrs, source) {
  const note = (name, raw, syntax, scope) => {
    const slot = addTo(entry.slots, name, () => ({ name, uses: 0, names: new Set(), scope: new Set(), syntax, files: new Set() }));
    slot.uses++;
    slot.files.add(file);
    slot.names.add(raw);
    for (const key of scope) slot.scope.add(key);
  };
  const named = (a) => {
    if (a.dynamicArg) return { name: '[dynamic]', raw: source.slice(a.attr.key.argument.expression.range[0], a.attr.key.argument.expression.range[1]) };
    return { name: (a.arg ?? 'default').replace(/\(.*\)$/, '(*)'), raw: a.arg ?? 'default' };
  };
  const own = attrs.find((a) => a.directive && a.dir === 'slot');
  if (own) {
    const { name, raw } = named(own);
    note(name, raw, 'v-slot', slotScope(el, own));
  }
  let implicit = false;
  for (const child of el.children) {
    if (child.type === 'VText') {
      if (child.value.trim() !== '') implicit = true;
    } else if (child.type === 'VExpressionContainer') {
      implicit = true;
    } else if (child.type === 'VElement') {
      const childAttrs = child.startTag.attributes.map((attr) => describe(attr, source));
      const slotAttr = childAttrs.find((a) => a.directive && a.dir === 'slot');
      const oldName = childAttrs.find((a) => !a.directive && a.lower === 'slot');
      const oldScope = childAttrs.find((a) => a.directive && a.dir === 'slot-scope');
      if (child.name === 'template' && slotAttr) {
        const { name, raw } = named(slotAttr);
        note(name, raw, 'v-slot', slotScope(child, slotAttr));
      } else if (oldName || (child.name === 'template' && oldScope)) {
        const raw = oldName?.value ?? 'default';
        note(raw.replace(/\(.*\)$/, '(*)'), raw, 'slot', slotScope(child, oldScope));
      } else {
        implicit = true;
      }
    }
  }
  if (implicit && !entry.slots.has('default')) note('default', 'default', 'implicit', []);
}

/** A BootstrapVue component made by `h("b-x")` or `createElement("b-x")`: counted as a use; its props are in the call, not read. */
function noteBvRenderCall(env, node, name) {
  const entry = bvEntry(env.context, name);
  entry.uses++;
  entry.files.set(env.file, (entry.files.get(env.file) ?? 0) + 1);
  entry.spellings.add('render call');
  env.add('bvTags', node);
}

/** What a bound value is, for the table of props: a function (an arrow, a method), data, a computed, a prop, a constant, a literal. */
function bindKind(context, file, info, node) {
  switch (node?.type) {
    case 'ArrowFunctionExpression':
    case 'FunctionExpression': return 'function';
    case 'Literal': return node.value === null ? 'null' : typeof node.value === 'object' ? 'expression' : typeof node.value;
    case 'TemplateLiteral': return 'string';
    case 'ArrayExpression': return 'array';
    case 'ObjectExpression': return 'object';
    case 'Identifier':
      if (info.methods.has(node.name)) return 'function';
      if (info.data.has(node.name)) return 'data';
      if (info.computed.has(node.name)) return 'computed';
      if (info.props.has(node.name)) return 'prop';
      return info.constants.has(node.name) || info.bindings.has(node.name) ? 'constant' : 'expression';
    default: return 'expression';
  }
}

/** The kind of a value written in a script or a template, for the keys of a field definition. */
function valueKind(node) {
  switch (node?.type) {
    case 'StringLiteral':
    case 'TemplateLiteral': return 'string';
    case 'BooleanLiteral': return 'boolean';
    case 'NumericLiteral': return 'number';
    case 'NullLiteral': return 'null';
    case 'Literal': return node.value === null ? 'null' : typeof node.value === 'object' ? 'expression' : typeof node.value;
    case 'ArrayExpression': return 'array';
    case 'ObjectExpression': return 'object';
    case 'Identifier': return 'reference';
    default: return isFunction(node) ? 'function' : 'expression';
  }
}

/** What a function returns: the arguments of its `return` statements, or the body of an arrow with an expression. */
function returnedValues(fn) {
  if (fn.body.type !== 'BlockStatement') return [fn.body];
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node.type !== 'string' || isFunction(node)) return;
    if (node.type === 'ReturnStatement' && node.argument) found.push(node.argument);
    for (const [key, child] of Object.entries(node)) if (!NOT_CHILDREN.has(key) && child && typeof child === 'object') visit(child);
  };
  visit(fn.body.body);
  return found;
}

/**
 * The elements of an array that a template names (`:fields="fields"`): read from the array literal itself, from data, a
 * computed or a method, a constant, or an import. `items` are `{ node, file }`; `dynamic` says that some part could not be read.
 */
function resolveList(context, file, info, node, depth = 0) {
  const out = { items: [], dynamic: false };
  const merge = (other) => {
    out.items.push(...other.items);
    out.dynamic ||= other.dynamic;
  };
  if (!node || depth > 8) return { items: [], dynamic: true };
  if (node.type === 'ArrayExpression') {
    for (const element of node.elements) {
      if (element === null) continue;
      if (element.type === 'SpreadElement') merge(resolveList(context, file, info, element.argument, depth + 1));
      else if (element.type === 'Identifier') {
        const constant = info.constants.get(element.name);
        if (constant?.type === 'ObjectExpression') out.items.push({ node: constant, file });
        else out.dynamic = true;
      } else out.items.push({ node: element, file });
    }
  } else if (node.type === 'Identifier' || (isMember(node) && (node.object.type === 'ThisExpression' || (node.object.type === 'Identifier' && node.object.name === '$parent')) && memberName(node) !== null)) {
    const name = node.type === 'Identifier' ? node.name : memberName(node);
    // `$parent.name` in a page's `Template.vue` is `name` of the root that the page's `main.js` builds.
    const sibling = isMember(node) && node.object.type === 'Identifier' ? posix.join(posix.dirname(file), 'main.js') : null;
    if (sibling !== null) {
      if (sibling === file || !context.sources.has(sibling)) return { items: [], dynamic: true };
      return resolveList(context, sibling, infoOf(context, sibling), { type: 'Identifier', name }, depth + 1);
    }
    const binding = info.bindings.get(name);
    if (info.data.has(name)) merge(resolveList(context, file, info, info.data.get(name).node, depth + 1));
    else if (info.computed.get(name)) for (const value of returnedValues(info.computed.get(name))) merge(resolveList(context, file, info, value, depth + 1));
    else if (info.constants.has(name)) merge(resolveList(context, file, info, info.constants.get(name), depth + 1));
    else if (binding && isLocalPath(binding.source)) {
      const target = resolveImport(file, binding.source, context.allFiles);
      const there = target === null ? undefined : infoOf(context, target).constants.get(binding.imported);
      if (there === undefined) out.dynamic = true;
      else merge(resolveList(context, target, infoOf(context, target), there, depth + 1));
    } else out.dynamic = true;
  } else if (node.type === 'ConditionalExpression') {
    merge(resolveList(context, file, info, node.consequent, depth + 1));
    merge(resolveList(context, file, info, node.alternate, depth + 1));
  } else if (isCall(node) && isMember(node.callee) && ['filter', 'slice', 'sort', 'reverse', 'concat'].includes(memberName(node.callee))) {
    merge(resolveList(context, file, info, node.callee.object, depth + 1));
    if (memberName(node.callee) === 'concat') for (const argument of node.arguments) merge(resolveList(context, file, info, argument, depth + 1));
  } else {
    out.dynamic = true;
  }
  return out;
}

/** Reads what `:fields` of a b-table says: each field written as a string or as a definition object, and the keys of those. */
function recordFields(context, file, info, entry, a) {
  const found = resolveList(context, file, info, a.expression);
  for (const { node, file: where } of found.items) {
    if (isString(node) || node.type === 'TemplateLiteral') {
      entry.fieldStrings++;
    } else if (node.type === 'ObjectExpression') {
      entry.fieldDefinitions++;
      for (const property of node.properties) {
        const spread = !isProperty(property);
        const key = spread ? '...' : (keyName(property) ?? '[computed]');
        const record = addTo(entry.fieldKeys, key, () => ({ key, uses: 0, kinds: new Set(), files: new Set() }));
        record.uses++;
        record.kinds.add(spread ? 'spread' : valueKind(valueOf(property)));
        record.files.add(where);
        if (spread) found.dynamic = true;
      }
    } else {
      found.dynamic = true;
    }
  }
  if (found.dynamic) entry.dynamic.push({ file, line: a.line, kind: 'fields', text: a.text });
}

/** Notes what one element is and is used with, for the BootstrapVue table and the directives. */
function recordBootstrap(context, file, info, env, el, tag, bv, attrs) {
  const source = env.source;
  for (const a of attrs) {
    if (!a.directive || !a.dir.startsWith('b-')) continue;
    const name = `v-${a.dir}`;
    const key = `${name}|${a.arg ?? ''}|${a.mods.join('.')}`;
    const record = addTo(context.bvDirectives, key, () => ({ name, arg: a.arg, modifiers: a.mods, uses: 0, files: new Set(), tags: new Set(), values: new Set() }));
    record.uses++;
    record.files.add(file);
    record.tags.add(bv ?? el.rawName);
    if (a.expression) record.values.add(source.slice(a.expression.range[0], a.expression.range[1]));
    context.add('bvDirectives', file, a.line, startTagLabel(el, [a]));
  }
  const name = bv ?? bvThroughIs(attrs);
  if (name === null) return;
  const entry = bvEntry(context, name);
  entry.uses++;
  entry.files.set(file, (entry.files.get(file) ?? 0) + 1);
  entry.spellings.add(bv === null ? 'component is' : tag);
  context.add('bvTags', file, el.loc.start.line, startTagLabel(el, attrs));
  const dynamic = (kind, a) => entry.dynamic.push({ file, line: a.line, kind, text: a.text });
  const prop = (property, a, form, written) => {
    const record = addTo(entry.props, property, () => ({ name: property, uses: 0, forms: new Set(), written: new Set(), via: new Set(), values: new Set(), sync: 0, kinds: new Set(), files: new Set() }));
    record.uses++;
    record.files.add(file);
    if (form) record.forms.add(form);
    if (written && written !== property) record.written.add(written);
    return record;
  };
  for (const a of attrs) {
    if (!a.directive) {
      const lower = a.lower;
      if (['class', 'style', 'id'].includes(lower)) {
        entry.fallthrough[lower]++;
        if (lower === 'id' && a.value !== null) entry.ids.add(a.value);
      } else if (lower === 'ref') {
        if (a.value !== null) {
          const ref = addTo(entry.refs, a.value, () => ({ name: a.value, uses: 0, methods: new Map(), files: new Set() }));
          ref.uses++;
          ref.files.add(file);
        }
      } else if (lower.startsWith('aria-') || lower.startsWith('data-')) entry.fallthrough.attrs++;
      else if (!['key', 'is', 'slot', 'slot-scope', 'inline-template'].includes(lower)) {
        const record = prop(toKebab(a.name), a, a.value === null ? 'flag' : 'string', a.name);
        if (a.value !== null) record.values.add(a.value);
        if (lower === 'detail-key' && a.value) noteItemKey(context, file, a.value, 'detail-key');
      }
      continue;
    }
    if (a.dir === 'bind') {
      if (a.dynamicArg) dynamic('dynamic prop', a);
      else if (a.arg === null) {
        const object = a.expression?.type === 'ObjectExpression' ? a.expression : a.expression?.type === 'Identifier' ? (info.data.get(a.expression.name)?.literal ?? info.moduleConsts.get(a.expression.name) ?? null) : null;
        if (object === null) dynamic('v-bind object', a);
        else {
          if (object.properties.some((property) => !isProperty(property) || property.computed)) dynamic('v-bind object', a);
          for (const { key } of entriesOf(object)) if (key !== null) prop(toKebab(key), a, null, key).via.add('v-bind object');
        }
      } else if (['class', 'style', 'id'].includes(a.arg)) {
        entry.fallthrough[a.arg]++;
        if (a.arg === 'id' && a.expression) entry.ids.add(`:${source.slice(a.expression.range[0], a.expression.range[1])}`);
      }
      else if (a.arg.startsWith('aria-') || a.arg.startsWith('data-')) entry.fallthrough.attrs++;
      else if (!['key', 'ref', 'is', 'slot', 'slot-scope'].includes(a.arg)) {
        const record = prop(toKebab(a.arg), a, 'bound', a.arg);
        record.kinds.add(bindKind(context, file, info, a.expression));
        if (a.arg === 'fields' && ['b-table', 'b-table-lite'].includes(name)) recordFields(context, file, info, entry, a);
        if (a.arg === 'detail-key' && stringOf(a.expression)) noteItemKey(context, file, stringOf(a.expression), 'detail-key');
        if (a.mods.includes('sync')) {
          record.sync++;
          const model = addTo(entry.models, `sync|${toKebab(a.arg)}|`, () => ({ kind: 'sync', name: toKebab(a.arg), modifiers: [], uses: 0, files: new Set() }));
          model.uses++;
          model.files.add(file);
        }
      }
    } else if (a.dir === 'on') {
      if (a.dynamicArg) dynamic('dynamic event', a);
      else if (a.arg === null) dynamic('v-on object', a);
      else {
        const native = a.mods.includes('native');
        const event = addTo(entry.events, a.arg, () => ({ name: a.arg, uses: 0, native: 0, files: new Set() }));
        event.uses++;
        event.files.add(file);
        if (native) {
          event.native++;
          entry.fallthrough.nativeListeners++;
        }
      }
    } else if (a.dir === 'model') {
      const model = addTo(entry.models, `v-model|${a.arg ?? ''}|${a.mods.join('.')}`, () => ({ kind: 'v-model', name: a.arg, modifiers: a.mods, uses: 0, files: new Set() }));
      model.uses++;
      model.files.add(file);
    } else if (!['if', 'else-if', 'else', 'for', 'slot', 'slot-scope', 'once', 'pre', 'cloak'].includes(a.dir)) {
      const directive = addTo(entry.directives, `v-${a.dir}`, () => ({ name: `v-${a.dir}`, uses: 0, files: new Set() }));
      directive.uses++;
      directive.files.add(file);
    }
  }
  recordSlots(entry, file, el, attrs, source);
}

/** Resolves the `$refs` accesses of a file against the refs of its template: the `bvRefs` hits, and the methods in the BootstrapVue table. */
function finalizeRefs(context, file, templated, scripted) {
  const bvRefs = [...templated.refs].filter(([, list]) => list.some((ref) => ref.bv)).map(([name]) => name).sort(byCodeUnit);
  for (const access of [...scripted, ...templated.refAccesses]) {
    const add = (note) => context.add('bvRefs', file, access.line, access.text, { note });
    if (access.name === null) {
      if (bvRefs.length > 0) add(`dynamic ref name; this file has BootstrapVue refs: ${bvRefs.join(', ')}`);
      continue;
    }
    const refs = templated.refs.get(access.name);
    if (refs === undefined) {
      add(`ref "${access.name}" is not in this file's template`);
    } else if (refs[0].bv) {
      add(`ref "${access.name}" is <${refs[0].tag}>`);
      const record = context.bvTags.get(refs[0].tag)?.refs.get(access.name);
      if (record && access.member !== null) record.methods.set(access.member, (record.methods.get(access.member) ?? 0) + 1);
    }
  }
}

/** The tables, as plain data: sorted, with sets turned into lists. */
function bootstrapTables(context) {
  const list = (set) => [...set].sort(byCodeUnit);
  const bvTags = [...context.bvTags.values()]
    .sort((a, b) => byCodeUnit(a.tag, b.tag))
    .map((entry) => ({
      ...(['b-table', 'b-table-lite'].includes(entry.tag)
        ? {
            fieldDefs: {
              definitions: entry.fieldDefinitions,
              strings: entry.fieldStrings,
              keys: [...entry.fieldKeys.values()].sort((a, b) => byCodeUnit(a.key, b.key)).map((record) => ({ key: record.key, uses: record.uses, kinds: list(record.kinds), files: list(record.files) })),
            },
          }
        : {}),
      ...(entry.tag === 'b-table'
        ? { itemKeys: [...context.itemKeys.values()].sort((a, b) => byCodeUnit(a.key, b.key)).map((record) => ({ key: record.key, uses: record.uses, how: list(record.how), files: list(record.files) })) }
        : {}),
      tag: entry.tag,
      uses: entry.uses,
      files: [...entry.files].sort(([a], [b]) => byCodeUnit(a, b)).map(([file, uses]) => ({ file, uses })),
      spellings: list(entry.spellings),
      props: [...entry.props.values()]
        .sort((a, b) => byCodeUnit(a.name, b.name))
        .map((prop) => {
          const out = { name: prop.name, uses: prop.uses, forms: list(prop.forms), written: list(prop.written), via: list(prop.via), kinds: list(prop.kinds), files: list(prop.files) };
          if (prop.values.size > 0) out.values = list(prop.values);
          if (prop.sync > 0) out.sync = prop.sync;
          return out;
        }),
      events: [...entry.events.values()].sort((a, b) => byCodeUnit(a.name, b.name)).map((event) => ({ name: event.name, uses: event.uses, native: event.native, files: list(event.files) })),
      models: [...entry.models.values()].map((model) => ({ kind: model.kind, name: model.name, modifiers: model.modifiers, uses: model.uses, files: list(model.files) })),
      slots: [...entry.slots.values()].sort((a, b) => byCodeUnit(a.name, b.name)).map((slot) => ({ name: slot.name, uses: slot.uses, names: list(slot.names), scope: list(slot.scope), syntax: slot.syntax, files: list(slot.files) })),
      refs: [...entry.refs.values()]
        .sort((a, b) => byCodeUnit(a.name, b.name))
        .map((ref) => ({ name: ref.name, uses: ref.uses, files: list(ref.files), methods: [...ref.methods].sort(([a], [b]) => byCodeUnit(a, b)).map(([name, uses]) => ({ name, uses })) })),
      directives: [...entry.directives.values()].sort((a, b) => byCodeUnit(a.name, b.name)).map((directive) => ({ name: directive.name, uses: directive.uses, files: list(directive.files) })),
      fallthrough: entry.fallthrough,
      ids: list(entry.ids),
      dynamic: entry.dynamic,
    }));
  const bvDirectives = [...context.bvDirectives.values()]
    .sort((a, b) => byCodeUnit(a.name, b.name))
    .map((record) => ({ name: record.name, arg: record.arg, modifiers: record.modifiers, uses: record.uses, files: list(record.files), tags: list(record.tags), values: list(record.values) }));
  return { bvTags, bvDirectives };
}

// ---- styles -------------------------------------------------------------------------------------------------------------------

/** The Bootstrap classes that BootstrapVue components render (and that plain Bootstrap markup of ours uses as well). */
const BS_CLASS =
  /^(page-(item|link)|pagination(-.+)?|tooltip(-inner)?|popover(-header|-body)?|btn(-.+)?|table(-.+)?|modal(-.+)?|dropdown(-.+)?|nav(-.+)?|tab-(content|pane)|toast(-.+)?|alert(-.+)?|badge(-.+)?|card(-.+)?|custom-(select|control|checkbox|radio|file|range|switch)(-.+)?|form-(control|group|check|row|inline)(-.+)?|input-group(-.+)?|list-group(-.+)?|spinner-(border|grow)(-.+)?|progress(-bar)?|breadcrumb(-.+)?)$/;

/**
 * The rule preludes of a stylesheet, as `{ text, offset }`: what stands before each `{` (a selector, or an at-rule's
 * header), with comments, strings and interpolations in it left alone. Nested rules (Sass, Less) come out too.
 */
function preludes(text, { strip = false } = {}) {
  let css = text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  if (strip) css = css.replace(/(^|[^:"'(\w])\/\/[^\n]*/g, (match, lead) => lead + ' '.repeat(match.length - lead.length));
  const found = [];
  let start = 0;
  for (let at = 0; at < css.length; at++) {
    const char = css[at];
    if (char === '"' || char === "'") {
      let end = at + 1;
      while (end < css.length && css[end] !== char && css[end] !== '\n') end += css[end] === '\\' ? 2 : 1;
      at = end;
    } else if (char === '#' && css[at + 1] === '{') {
      let depth = 0;
      for (; at < css.length; at++) {
        if (css[at] === '{') depth++;
        else if (css[at] === '}' && --depth === 0) break;
      }
    } else if (char === '{') {
      found.push({ text: css.slice(start, at), offset: start });
      start = at + 1;
    } else if (char === '}' || char === ';') {
      start = at + 1;
    }
  }
  return found;
}

/** The classes and ids a selector names, and the values of its attribute selectors. */
function selectorParts(selector) {
  const attributes = [...selector.matchAll(/\[\s*([\w-]+)\s*[~|^$*]?=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g)].map((match) => ({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? '' }));
  const plain = selector.replace(/"[^"]*"|'[^']*'/g, '""');
  return {
    classes: [...plain.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]),
    ids: [...plain.matchAll(/#(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]),
    attributes,
  };
}

/** Reads one stylesheet: the `bvCss`, `transitionClasses` and `scopedDeep` hits. `startLine` is the line `text` starts on. */
function scanStyleText(context, file, text, startLine, { scoped, lang }) {
  styleImports(context, file, text, startLine);
  const sass = ['scss', 'sass', 'less', 'stylus', 'styl'].includes(lang);
  for (const { text: raw, offset } of preludes(text, { strip: sass })) {
    const selector = raw.trim();
    if (selector === '' || selector.startsWith('@')) continue;
    const lead = raw.length - raw.trimStart().length;
    const line = startLine + (text.slice(0, offset + lead).match(/\n/g) ?? []).length;
    const { classes, ids, attributes } = selectorParts(selector);
    const bootstrapVue =
      classes.some((name) => /^(b|bv)-[a-z]/.test(name)) ||
      [...ids, ...attributes.map(({ value }) => value)].some((name) => /__BVID__/.test(name)) ||
      attributes.some(({ name, value }) => ['class', 'id'].includes(name) && /^(b|bv)-/.test(value));
    if (bootstrapVue) context.add('bvCss', file, line, selector);
    const rendered = unique(classes.filter((name) => BS_CLASS.test(name)));
    if (rendered.length > 0) context.add('bsCss', file, line, selector, { note: rendered.map((name) => `.${name}`).join(', ') });
    if (classes.some((name) => /-(enter|leave)$/.test(name))) context.add('transitionClasses', file, line, selector);
    if (scoped && /(>>>|\/deep\/|::v-deep(?!\s*\())/.test(selector)) context.add('scopedDeep', file, line, selector);
  }
}

/** Scans one reachable file: its scripts, its template, its styles. */
function scanFile(context, file) {
  const read = context.parsed.get(file);
  const info = infoOf(context, file);
  const scripted = scanScripts(context, file, read, info);
  watchNotes(context, file, info);
  const templated = scanTemplate(context, file, read, info);
  finalizeRefs(context, file, templated, scripted);
  for (const style of read.styles) scanStyleText(context, file, style.text, style.startLine, style);
  for (const { src, line } of read.styleSources ?? []) styleImports(context, file, `@import "${src.startsWith('.') || src.startsWith('@/') || src.startsWith('~') || src.startsWith('/') ? src : `./${src}`}";`, line);
  dataMergeNotes(context, file, info);
}

// ---- packages -------------------------------------------------------------------------------------------------------------------

/** Names of packages that are for Vue: `vue-*`, `*-vue`, `vuex`, `@vue/*`, `@scope/vue-*`. */
const VUE_NAME = /(^|[/@-])vue($|[-/])|^vuex($|\/)|-vue$/;
const VUE_DEPENDENCY = /^(vue|vuex|vue-router|vue-.+|@vue\/.+)$/;

/** Whether a semver range lets a major version of `vue` through (a comparison of majors, not of the whole range). */
export function admitsMajor(range, major) {
  return range.split('||').some((alternative) => {
    let min = 0;
    let max = Infinity;
    for (const token of alternative.trim().split(/\s+/).filter(Boolean)) {
      const found = /^(\^|~|>=|>|<=|<|=)?v?(\d+|x|\*)/.exec(token);
      if (found === null || found[2] === 'x' || found[2] === '*') continue;
      const number = Number(found[2]);
      const op = found[1] ?? '';
      if (op === '>=' || op === '>') min = Math.max(min, number);
      else if (op === '<') max = Math.min(max, number - 1);
      else if (op === '<=') max = Math.min(max, number);
      else {
        min = Math.max(min, number);
        max = Math.min(max, number);
      }
    }
    return min <= major && major <= max;
  });
}

/** Why a package counts as depending on Vue, as a list of short reasons. */
function vueSignals(name, manifest) {
  if (name === 'vue') return ['is vue'];
  const signals = [];
  if (VUE_NAME.test(name)) signals.push('name');
  const peer = manifest?.peerDependencies?.vue;
  if (peer) signals.push(`peer vue ${peer}`);
  for (const group of [manifest?.dependencies, manifest?.peerDependencies]) {
    for (const key of Object.keys(group ?? {})) if (key !== 'vue' && VUE_DEPENDENCY.test(key)) signals.push(`depends on ${key}`);
  }
  if (manifest?.importsVue) signals.push('imports vue');
  return unique(signals);
}

/** Every package the reachable files (and their stylesheets) import, with who imports it and whether it depends on Vue. */
function packageTable(context) {
  const byName = new Map();
  const add = (name, importer) => {
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(importer);
  };
  for (const file of context.files) {
    for (const spec of context.followed.get(file).packages) add(spec.package, { file, line: spec.line, kind: spec.kind, specifier: spec.source.replace(/^~/, ''), imports: spec.names ?? [], alias: spec.alias });
  }
  for (const spec of context.stylePackages) add(spec.package, { file: spec.file, line: spec.line, kind: 'style import', specifier: spec.specifier.replace(/^~/, ''), imports: [] });
  return [...byName]
    .sort(([a], [b]) => byCodeUnit(a, b))
    .map(([name, importers]) => {
      const manifest = context.manifest === null ? undefined : context.manifest(name);
      const signals = vueSignals(name, manifest ?? null);
      const peer = manifest?.peerDependencies?.vue;
      const installed = context.manifest === null ? null : manifest !== null;
      const alias = importers.find((importer) => importer.alias !== undefined)?.alias;
      if (installed === false && alias === undefined) for (const importer of importers) context.unresolved.push({ file: importer.file, line: importer.line, specifier: importer.specifier, kind: importer.kind, why: 'package is not installed' });
      const entry = {
        name,
        version: manifest?.version ?? null,
        installed,
        dependsOnVue: signals.length > 0,
        signals,
        admitsVue3: name === 'vue' ? true : peer ? admitsMajor(peer, 3) : null,
        importers: importers.map(({ file, line, kind, specifier, imports }) => ({ file, line, kind, specifier, imports })).sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line),
      };
      if (alias !== undefined) entry.alias = alias;
      return entry;
    });
}

// ---- what a stylesheet imports --------------------------------------------------------------------------------------------------

const STYLE_IMPORT = /@(?:import|use|forward)\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s"');]+))/g;

/** The stylesheet a Sass or CSS import names (`./vars` is `_vars.scss`, a partial), or null. */
function styleTarget(context, file, specifier) {
  const base = specifier.startsWith('@/') ? posix.normalize(`src/${specifier.slice(2)}`) : posix.join(posix.dirname(file), specifier);
  const directory = posix.dirname(base);
  const name = posix.basename(base);
  const candidates = [base, `${base}.scss`, `${base}.css`, `${base}.sass`, `${base}.less`, `${directory}/_${name}.scss`, `${directory}/_${name}.sass`, `${base}/index.scss`, `${base}/_index.scss`];
  return candidates.find((path) => context.allFiles.has(path) && STYLE_EXTENSIONS.has(extensionOf(path))) ?? null;
}

/** Follows the `@import`, `@use` and `@forward` of a stylesheet: a package (`~name`) is noted, a file is scanned, a file that is missing is unresolved. */
function styleImports(context, file, text, startLine) {
  const css = text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  for (const match of css.matchAll(STYLE_IMPORT)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (/^(https?:|\/\/|data:|sass:)/.test(specifier)) continue;
    const line = startLine + (css.slice(0, match.index).match(/\n/g) ?? []).length;
    if (specifier.startsWith('~')) {
      context.stylePackages.push({ file, line, specifier, package: packageOf(specifier) });
      continue;
    }
    // `/css/x.css` is served from `public/`.
    const rooted = specifier.startsWith('/') ? `public${specifier.split(/[?#]/)[0]}` : null;
    const target = rooted === null ? styleTarget(context, file, specifier) : context.allFiles.has(rooted) ? rooted : null;
    if (target === null) context.unresolved.push({ file, line, specifier, kind: 'style import', why: rooted === null ? 'no such file' : 'no such file under public/' });
    else scanAsset(context, target);
  }
}

/** Scans a stylesheet that is not in a `.vue` file, once. */
function scanAsset(context, path) {
  if (context.styleSeen.has(path)) return;
  context.styleSeen.add(path);
  const text = context.assets.get(path);
  if (typeof text === 'string') scanStyleText(context, path, text, 1, { scoped: false, lang: extensionOf(path) });
}

// ---- the report ------------------------------------------------------------------------------------------------------

/** The table of hits of one kind. */
function hitTable(list) {
  const withNote = list.some(({ note }) => note);
  const lines = withNote ? ['| file:line | text | note |', '| --- | --- | --- |'] : ['| file:line | text |', '| --- | --- |'];
  for (const { file, line, text, note } of list) lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(text))} |${withNote ? ` ${cell(oneLine(note ?? ''))} |` : ''}`);
  return lines;
}

const list = (items) => (items.length === 0 ? '' : items.join(', '));

/** The specification of what BootstrapVue components are used with, as markdown: one table per aspect, per tag. */
function bootstrapSection(bvTags, bvDirectives) {
  const lines = ['', '## BootstrapVue components', ''];
  if (bvTags.length === 0) lines.push('None.');
  else {
    lines.push(
      'What each `b-*` tag is used with in the files that were scanned: our own replacements need these props, events, `v-model`s, slots and methods, no more and no less. ' +
        'A prop is written in kebab or camel case, as `:name`, `name="..."` or bare (`flag`); `via` says it came from a `v-bind` object that could be read.',
      '',
      '| tag | uses | files | spelled |',
      '| --- | ---: | ---: | --- |',
    );
    for (const entry of bvTags) lines.push(`| ${code(entry.tag)} | ${entry.uses} | ${entry.files.length} | ${cell(list(entry.spellings.map((spelling) => code(spelling))))} |`);
    for (const entry of bvTags) {
      lines.push('', `### ${entry.tag}`, '', `${entry.uses} uses in ${entry.files.length} files: ${list(entry.files.map(({ file, uses }) => `${code(file)} (${uses})`))}.`);
      if (entry.props.length > 0) {
        lines.push('', '| prop | uses | files | form | value is | written | via | values |', '| --- | ---: | ---: | --- | --- | --- | --- | --- |');
        for (const prop of entry.props) {
          const forms = prop.sync ? [...prop.forms, `.sync x${prop.sync}`] : prop.forms;
          lines.push(`| ${code(prop.name)} | ${prop.uses} | ${prop.files.length} | ${list(forms)} | ${list(prop.kinds)} | ${cell(list(prop.written.map((name) => code(name))))} | ${list(prop.via)} | ${cell(list((prop.values ?? []).map((value) => code(value))))} |`);
        }
      }
      if (entry.fieldDefs) {
        const { definitions, strings, keys } = entry.fieldDefs;
        lines.push('', `Fields: ${definitions} definitions written out and ${strings} plain strings were read from \`:fields\`; the keys the definitions use (a key that is \`function\` is a formatter or a class function, and \`string\` for \`formatter\` names a method):`);
        if (keys.length > 0) {
          lines.push('', '| field key | uses | value is | files |', '| --- | ---: | --- | --- |');
          for (const key of keys) lines.push(`| ${code(key.key)} | ${key.uses} | ${list(key.kinds)} | ${key.files.length} |`);
        }
      }
      if (entry.itemKeys) {
        lines.push('', 'Special item keys (where they are written):');
        if (entry.itemKeys.length === 0) lines.push('', 'None.');
        else {
          lines.push('', '| item key | uses | written as | files |', '| --- | ---: | --- | --- |');
          for (const key of entry.itemKeys) lines.push(`| ${code(key.key)} | ${key.uses} | ${list(key.how)} | ${key.files.length} |`);
        }
      }
      if (entry.events.length > 0) {
        lines.push('', '| event | uses | files | `.native` |', '| --- | ---: | ---: | ---: |');
        for (const event of entry.events) lines.push(`| ${code(event.name)} | ${event.uses} | ${event.files.length} | ${event.native} |`);
      }
      if (entry.models.length > 0) {
        lines.push('', '| model | name | modifiers | uses | files |', '| --- | --- | --- | ---: | ---: |');
        for (const model of entry.models) lines.push(`| ${model.kind === 'sync' ? '`.sync`' : '`v-model`'} | ${model.name ?? ''} | ${list(model.modifiers)} | ${model.uses} | ${model.files.length} |`);
      }
      if (entry.slots.length > 0) {
        lines.push('', '| slot | uses | files | written | scope | syntax |', '| --- | ---: | ---: | --- | --- | --- |');
        for (const slot of entry.slots) lines.push(`| ${cell(code(slot.name))} | ${slot.uses} | ${slot.files.length} | ${cell(list(slot.names.map((name) => code(name))))} | ${cell(list(slot.scope.map((name) => code(name))))} | ${slot.syntax} |`);
      }
      if (entry.refs.length > 0) {
        lines.push('', '| ref | uses | files | methods called on it |', '| --- | ---: | ---: | --- |');
        for (const ref of entry.refs) lines.push(`| ${code(ref.name)} | ${ref.uses} | ${ref.files.length} | ${cell(list(ref.methods.map(({ name, uses }) => `${code(name)} (${uses})`)))} |`);
      }
      const { fallthrough } = entry;
      if (entry.ids.length > 0) lines.push('', `Ids: ${list(entry.ids.map((id) => code(id)))}.`);
      lines.push('', `Fallthrough: \`class\` ${fallthrough.class}, \`style\` ${fallthrough.style}, \`id\` ${fallthrough.id}, \`aria-*\`/\`data-*\` attributes ${fallthrough.attrs}, \`.native\` listeners ${fallthrough.nativeListeners}.`);
      if (entry.directives.length > 0) lines.push('', `Directives: ${list(entry.directives.map(({ name, uses }) => `${code(name)} (${uses})`))}.`);
      if (entry.dynamic.length > 0) {
        lines.push('', 'Dynamic (not readable from the template):', '', '| file:line | kind | text |', '| --- | --- | --- |');
        for (const { file, line, kind, text } of entry.dynamic) lines.push(`| ${cell(code(`${file}:${line}`))} | ${kind} | ${cell(code(shorten(text)))} |`);
      }
    }
  }
  lines.push('', '## BootstrapVue directives', '');
  if (bvDirectives.length === 0) lines.push('None.');
  else {
    lines.push('| directive | argument | modifiers | uses | files | on | values |', '| --- | --- | --- | ---: | ---: | --- | --- |');
    for (const record of bvDirectives) {
      lines.push(`| ${code(record.name)} | ${record.arg ?? ''} | ${cell(list(record.modifiers.map((modifier) => code(modifier))))} | ${record.uses} | ${record.files.length} | ${cell(list(record.tags.map((tag) => code(tag))))} | ${cell(list(record.values.map((value) => code(shorten(value)))))} |`);
    }
  }
  return lines;
}

/** The calls of `$bvToast`, `$bvModal` and the `bv::` events, with the whole text of each option. */
function callsSection(bvCalls) {
  const lines = ['', '## BootstrapVue calls', ''];
  if (bvCalls.length === 0) {
    lines.push('None.');
    return lines;
  }
  lines.push('The arguments and the options of every call, written out whole: our own `$bvToast` and `$bvModal` have to take these.', '', '| file:line | call | arguments | options |', '| --- | --- | --- | --- |');
  for (const { file, line, call, args, options } of bvCalls) {
    const shown = options === null ? '' : options.map(({ key, value }) => `${key}: ${code(value)}`).join('; ');
    lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(call))} | ${cell(args.map((arg) => code(arg)).join(', '))} | ${cell(shown)} |`);
  }
  return lines;
}

/** What the build config says that the scan used: the pages a condition changes, and the aliases. */
function configSection(config) {
  const lines = ['', '## Build config', '', `${code(config.path)} was read, not run. Pages: ${config.pages.length}.`];
  if (config.conditional.length > 0) lines.push('', `Pages that the config adds or deletes by a condition (all of them are scanned): ${list(config.conditional)}.`);
  if (config.aliases.length > 0) {
    lines.push('', '| alias | for | what the scan does |', '| --- | --- | --- |');
    for (const alias of config.aliases) {
      lines.push(`| ${code(alias.key + (alias.exact ? '$' : ''))} | ${code(alias.to)} | ${!alias.local ? 'a package path: nothing to follow' : alias.key === 'vue' ? 'the compat shim: not followed' : 'followed: the file is scanned as ours'} |`);
    }
  }
  return lines;
}

/** The packages that depend on Vue, with who imports them, and the other packages in a line. */
function packagesSection(packages) {
  const lines = ['', '## Packages that depend on Vue', ''];
  // A package that the build replaces by a file of ours is not used as a package; the alias of `vue` to the compat shim is not followed.
  const followed = ({ alias }) => alias !== undefined && !alias.endsWith('(not followed)');
  const vue = packages.filter((entry) => entry.dependsOnVue && !followed(entry));
  if (vue.length === 0) lines.push('None.');
  else {
    lines.push('| package | version | why it depends on Vue | admits Vue 3 | imported by |', '| --- | --- | --- | --- | --- |');
    for (const entry of vue) {
      const who = entry.importers.map(({ file, line, imports }) => `${code(`${file}:${line}`)}${imports.length > 0 ? ` (${imports.join(', ')})` : ''}`);
      const installed = entry.installed === false ? 'not installed' : (entry.version ?? '');
      const admits = entry.admitsVue3 === null ? 'not said' : entry.admitsVue3 ? 'yes' : 'no';
      lines.push(`| ${code(entry.name)} | ${installed} | ${cell(list(entry.signals))} | ${admits} | ${cell(list(who))} |`);
    }
  }
  const replaced = packages.filter(followed);
  if (replaced.length > 0) lines.push('', `Replaced by an alias of the build config (not the package): ${list(replaced.map((entry) => `${code(entry.name)} -> ${code(entry.alias)}`))}.`);
  const others = packages.filter((entry) => !entry.dependsOnVue && !followed(entry));
  lines.push('', `Other packages imported: ${others.length === 0 ? 'none' : list(others.map((entry) => `${code(entry.name)} (${entry.importers.length})`))}.`);
  return lines;
}

/**
 * The report as markdown: the scope, totals, each kind with its hits, the tables, the imports that were not followed
 * and the errors.
 * @param {ReturnType<typeof scan>} result
 * @returns {string}
 */
export function renderReport(result) {
  const { scope, hits, dynamic, unresolved, errors, bvTags, bvDirectives, bvCalls, packages } = result;
  const lines = ['# No-compat scan', ''];
  const parts = [...(scope.config ? [`build config ${code(scope.config.path)} (${scope.config.pages.length} pages)`] : []), ...scope.prefixes.map((prefix) => code(prefix))];
  const where = parts.length === 0 ? 'every page entry' : parts.join(' and ');
  lines.push(
    `Scope: ${where}: ${scope.entries.length} page entries reach ${scope.files.length} of ${scope.total} files. ` +
      `${unresolved.length} imports could not be followed, ${dynamic.length} were expanded from a pattern.`,
    '',
    '| Group | Pattern | Kind | Hits | Files |',
    '| --- | --- | --- | ---: | ---: |',
  );
  for (const { key, group, note } of KINDS) lines.push(`| ${group} | ${key} | ${note ? 'note' : 'hit'} | ${hits[key].length} | ${new Set(hits[key].map(({ file }) => file)).size} |`);
  for (const { key, why, note } of KINDS) {
    lines.push('', `## ${key}`, '', `${note ? '(note) ' : ''}${why}`, '');
    if (hits[key].length === 0) lines.push('None.');
    else lines.push(...hitTable(hits[key]));
  }
  lines.push(...bootstrapSection(bvTags, bvDirectives), ...callsSection(bvCalls), ...packagesSection(packages));
  if (scope.config) lines.push(...configSection(scope.config));
  lines.push('', '## Unresolved imports', '');
  if (unresolved.length === 0) lines.push('None.');
  else {
    lines.push('| file:line | kind | specifier | why |', '| --- | --- | --- | --- |');
    for (const { file, line, kind, specifier, why } of unresolved) lines.push(`| ${cell(code(`${file}:${line}`))} | ${kind} | ${cell(code(specifier))} | ${why} |`);
  }
  lines.push('', '## Expanded imports', '');
  if (dynamic.length === 0) lines.push('None.');
  else {
    lines.push('| file:line | pattern | files |', '| --- | --- | --- |');
    for (const { file, line, pattern, matched } of dynamic) lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(pattern))} | ${matched.length} |`);
  }
  lines.push('', '## Errors', '');
  if (errors.length === 0) lines.push('None.');
  for (const { file, kind, message, line } of errors) lines.push(`- ${code(line === undefined ? file : `${file}:${line}`)} (${kind}): ${oneLine(message)}`);
  return `${lines.join('\n')}\n`;
}

// ---- the command -----------------------------------------------------------------------------------------------------

/**
 * @param {string[]} argv
 * @returns {{ root: string | undefined, entries: string[], config: string | undefined, json: boolean }}
 * @throws {Error} on an unknown option, a positional argument, or `--root`, `--entries` or `--config` without a value
 */
export function parseArgs(argv) {
  const { values } = parseNodeArgs({
    args: argv,
    options: { root: { type: 'string' }, entries: { type: 'string', multiple: true }, config: { type: 'string' }, json: { type: 'boolean' } },
    allowPositionals: false,
  });
  return { root: values.root, entries: values.entries ?? [], config: values.config, json: values.json === true };
}

/**
 * Scans the tree under `root` (default: the repo root) and prints the report, or with `--json` the result. The
 * report goes to `out`, usage errors to `err`. Exit 0 whatever is found.
 * @param {string[]} argv
 * @param {{ root?: string, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {number} the exit code
 */
export function run(argv, { root: defaultRoot = repoRoot, out = process.stdout, err = process.stderr } = {}) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  const root = resolve(options.root ?? defaultRoot);
  if (!hasSrc(root)) {
    err.write(`${root} is not a directory with a src/ folder\n${USAGE}\n`);
    return 2;
  }
  let config;
  if (options.config !== undefined) {
    const path = isAbsolute(options.config) ? options.config : resolve(root, options.config);
    try {
      config = { path: relative(root, path).split('\\').join('/'), source: readFileSync(path, 'utf8') };
    } catch (error) {
      err.write(`cannot read the build config ${path}: ${error.message}\n${USAGE}\n`);
      return 2;
    }
  }
  const result = scan(readSources(root), { entries: options.entries, config, assets: readAssets(root), manifest: manifestReader(root) });
  out.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : renderReport(result));
  return 0;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

// Run the CLI only when executed directly, so tests can import `scan`.
if (isMain()) {
  process.exitCode = run(process.argv.slice(2));
}
