interface ReqireConfigurable {
  config: (config: {
    lookaheadMap: { [key: string]: string[] },
    paths: { [key: string]: string },
    mapPath: () => string,
    baseUr: string;
  }) => Require;
}

type require = (deps: string[], callback: () => {}, sync: boolean) => void;
type Require = ReqireConfigurable & require;

type defineNames = (name: string, deps: string[], callback: () => {}, sync: boolean) => void;
type defineRegular = (deps: string[], callback: () => {}, sync: boolean) => void;

declare const require: Require;
declare const define: defineNames & defineRegular;


interface Blick {
  attrSplitter: RegExp;
  collector: { [key: string]: any };
  options: { [key: string]: any };
  schnauzer: any;
  search: RegExp;
  version: string;

  parse(text: string): Blick;
  registerDecorator(name: string, decorator: () => {}): void;
  registerHelper(name: string, decorator: () => {}): void;
  registerPartial(name: string, decorator: () => {}): void;
  render(data: any[], extra: any[]): string;
  setTags(tags: string[]): void;
  unregisterDecorator(name: string): void;
  unregisterHelper(name: string): void;
  unregisterPartial(name: string): void;
}

interface VOMItem {
  parentNode?: VOMItem;
  childNodes?: VOMItem[];
  root?: { chidNodes: VOMItem[] };
  [key: string]: any;
}

interface VOM {
  model: { [key: string] : any }[] | { [key: string] : any };
  options: { [key: string]: any };
  id: number;

  addProperty(property: string, item: any, readonly: boolean): void;
  appendChild(item: VOMItem | any, parent?: VOMItem): void;
  destroy(): void;
  getCleanModel<T>(item: VOMItem[]): T;
  getElementById(id: string): VOMItem;
  getElementsByProperty(property: string, value: any): VOMItem[];
  getProperty(property: string, item: VOMItem): any;
  insertAfter(item: VOMItem | any, sibling: VOMItem): VOMItem;
  insertBefore(item: VOMItem | any, sibling: VOMItem): VOMItem;
  prependChild(item: VOMItem | any, parent: VOMItem): VOMItem;
  reinforcePropertyreinforceProperty(
    model: VOMItem[],
    item: VOMItem,
    value: any,
    writeable?: boolean,
    enumable?: boolean
  ): void;
  removeChild(item: VOMItem): VOMItem;
  replaceChild(newItem: any, item: VOMItem): VOMItem;
  sortChildren(callback: () => {}, model: VOMItem[], children: VOMItem[]): void;
}

interface CircularOptions {
  hash?: string;
  partials?: { [key: string]: () => {} },
  helpers?: { [key: string]: () => {} },
  decorators?: { [key: string]: () => {} },
}

declare class Promise {
  constructor (fn: () => {});

  private _state = number;
  private _handled = boolean;
  private _value = any;
  private _deferreds = [];
  private _returnFn = () => {};

  static private _cache = {};
  static all(promises: Promise[]): Promise;

  then(onFulfilled: () => {}, onRejected: () => {}): Promise;
  catch(onRejected: () => {}): Promise;
  cancel(id: string): Promise;
}

export declare class Circular {
  version: string;
  id: string;
  name: string;
  options: CircularOptions;

  constructor(name: string, options?: CircularOptions): Circular;
  constructor(options?: CircularOptions): Circular;

  static Component<T>(
    options: {
      selector: string,
      template?: string,
      $?: {
        [key: string]: string[];
      };
      name?: string;
      autoInit: boolean;
      partials?: { [key: string]: () => {} },
      helpers?: { [key: string]: () => {} },
      decorators?: { [key: string]: () => {} },
      circular?: Circular;
      hash?: string;
    },
    objClass: T
  ): {
    Klass: T,
    selector: string,
    templates: Blick,
    styles: HTMLStyleElement,
    name: string,
    init: (el: HTMLElement | string) =>  T;
  };
  static Toolbox: {
    Promise: Promise;
    storageHelper: {
      fetch(key: string): void;
      saveLazy(data: JSON, key: string, obj: any): void;
      save(data: JSON, key: string): void;
    };
    convertToType(input: any): any;
    closest(element: HTMLElement, selector: string, root: HTMLElement): HTMLElement | null;
    $(selector: string, root: HTMLElement): HTMLElement;
    $$(selector: string, root: HTMLElement): HTMLElement[];
    addClass(element: HTMLElement, className: string): void;
    removeClass(element: HTMLElement, className: string): void;
    hasClass(element: HTMLElement, className: string): boolean;
    toggleClass(element: HTMLElement, className: string, condition: boolean): void;
    toggleClasses(oldElm: HTMLElement, newElm: HTMLElement, oldClass: string, newClass: string): void;

    addEvent(element: HTMLElement, type: string, func: Function, cap?: boolean): removeEvents;
    addEvents(elements: HTMLElement[], type: string, func: Function, cap?: boolean): removeEvents;
    removeEvents(collection: FUnction[]): void;
    ajax<T>(url: string, prefs: {

    }): Promise<T>;
    captureResources(): { [key: string]: HTMLStyleElement | HTMLScriptElement | HTMLLinkElement };
    requireResources(
      data: {
        styleSheets: HTMLStyleElement[];
        scripts: HTMLScriptElement[];
        path: string;
      },
      type: 'styles' | 'scripts',
      container: HTMLElement
    ): Promise<Promise<HTMLStyleElement | HTMLScriptElement | HTMLLinkElement>[]>;
    errorHandler(e: any): void;
    isArray(array: any): boolean;
    keys(obj: { [key: string]: any }): string[];
    lazy(fn: Function, obj: JSON, pref: any): void;
    normalizePath(path: string): string;
    parentsIndexOf(elements: HTMLElement[], target: HTMLElement): number;
    itemsSorter<T>(a: any, b: any, type: string, asc: boolean): T[];
  };
  static instance: Circular;

  initComponents<T>(selector: HTMLElement | string, context: HTMLElement): T;
  destroyComponents<T>(insts: T[]): void;
  getComponent<T>(name: string): T;
  destroy(): void;
  model(model, options): VOM;
  template(template: string, options: {
    partials?: { [key: string]: () => {} }, // TODO: repetitive
    helpers?: { [key: string]: () => {} },
    decorators?: { [key: string]: () => {} },
  }): Blick;

  subscribe<T>(inst: string | any, comp: string, attr: string, callback: T | {
    regexp: RegExp;
    names: string[];
    callback: T;
  }, trigger: booleaan): T;
  publish(inst: string | any, comp: string, attr: string, data: any): void;
  unsubscribe(inst: string | any, comp: string, attr: string, callback: Function): void;

  addRoute(data: { path: RegExp, callback: Function }, trigger?: boolean, hash?: string): void;
  removedRoute(data: { path: RegExp, callback: Function }): void;
  toggleRoute(data: { path: RegExp, callback: Function }, isOn: boolean): void;

  loadResource(fileName: string, cache: boolean | number): Promise<{
    scripts: HTMLScriptElement[];
    styleSheets: HTMLStyleElement[];
    body: HTMLBodyElement,
    head: HTMLHeadElement,
    path: string,
  }>;
  insertResources(container: HTMLElement, data: {
    path: string,
    body?: HTMLElement
  }): Promise<HTMLElement>;
  insertModule(fileName: string, container: HTMLElement): Promise<Promise<HTMLElement>>;
  renderModule(data: ResourceModulesData): Promise<HTMLElement>;
}

interface ModulesMap<T> {
  [name: string]: T;
}

interface ResourceModulesData {
  container: HTMLElement;
  modulesMap: ModulesMap;
  name: string;
  previousName: any;
  init: boolean;
  returnData: boolean;
  data: any;
  dontWrap: boolean;
  preInit: string[];
  require: boolean;
  transition: (init: boolean, data: ResourceModulesData, modules: ModulesMap) => {};
}
