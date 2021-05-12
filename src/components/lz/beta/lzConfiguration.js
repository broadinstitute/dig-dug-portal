import LocusZoom from "locuszoom"
import idCounter from "@/utils/idUtils"

// Layout wrapper
// new LzLayout(locuszoom_layout_object)
// new LzLayout(locuszoom_layout_object, optionals)
// new LzLayout(locuszoom_layout_string)
// new LzLayout(locuszoom_layout_string, optionals)
// methods
// - withNamespace(original, target)
// - addFields(fieldnames)
// - configuredWith(property, value)
// getters
// - full

class LzLayout {
    #layout = null;
    constructor(firstParam, secondParam) {
        if (firstParam === Object(firstParam) && typeof secondParam !== 'undefined') {
            this.#layout = LocusZoom.Layouts.merge(firstParam, secondParam);
        } else if (firstParam === Object(firstParam)) {
            this.#layout = firstParam;
        } else if (typeof firstParam === 'string' && typeof secondParam !== 'undefined') {
            this.#layout = LocusZoom.get('panel', firstParam, secondParam);
        } else if (typeof firstParam === 'string') {
            this.#layout = LocusZoom.get('panel', firstParam)
        }
    }
    
    withNamespace(original_namespace, target_namespace) {
        this.#layout = LocusZoom.Layouts.renameFields(
            this.#layout, 
            original_namespace, 
            target_namespace, 
            warn_transforms = true
        )
        return this;
    }

    setProperty(property, value) {
        this.#layout = LocusZoom.Layouts.mutate_attrs(this.#layout, property, value);
        return this;
    }

    addRule(property, value, prepend=false) {
        const isArray = Array.isArray(LocusZoom.Layouts.query_attrs(this.#layout, 'fields'));
        if (isArray) {
            this.#layout = this.setProperty(property, id => {
                if (prepend) {
                    return [
                        value,
                        ...id
                    ]
                } else {
                    return [
                        ...id,
                        value
                    ]
                }
            });
        } else {
            console.warn(property, 'not an array for the given layout');
        }
        return this;
    }

    addFields(binder, ...fieldnames) {
        fieldnames.forEach(fieldname => {
            this.addRule('fields', `${binder}:${fieldname}`);
        });
        return this;
    }

    get full() {
        try {
            if (this.#layout !== null) {
                return this.#layout;
            }
            throw Error(`Layout hasn't been properly initialized. layout: ${this.#layout}`);
        } catch(e) {
            console.warn(e);
        } finally {
            return null;
        }
    }
}

// Datasource wrapper
// -> BioIndexDatsource Wrapper
// new LzDataSource(name, BaseAdapter, params)
// -> registers BaseAdapter if it doesn't exist in Lz?
// new LzDataSource(BaseAdapter, params)
// -> registers BaseAdapter if it doesn't exist in Lz?
// methods
// - withNamespace(target)
// - withParams(parameters)
// - withParam(name, value)
// getters
// - full

class LzDataSource {
    #name = null;
    #datasource = null;
    constructor(firstParam, secondParam, thirdParam) {
        if (firstParam === Object(firstParam)) {
            // 
        } else if (typeof firstParam === 'string') {
            this.#name = firstParam;
        }
        if (secondParam === Object(secondParam)) {
            // 
        }
    }

    withName(target) {
        this.#name = target;
        // TODO
        return this;
    }

    withParams(target) {
        // TODO
        return this;     
    }

    withParam(name, value) {
        // TODO
        return this;
    }

    get full() {
        try {
            if (this.#name !== null && this.#datasource !== null) {
                return [this.#name, this.#datasource];
            }
            throw Error(`One of 'namespace' or 'datasource' hasn't been initialized. name: ${this.#name} datasource: ${this.#datasource}`);
        } catch(e) {
            console.warn(e);
            return null;
        }
    }
}

// DataClass Component
// new LzPanelClass(new LzLayout, new LzDataSource)
// constructor:
// - create namespaces
// methods:
// - initialize(plot)
// => registers everything to plot
// getters:
// - namespaced datasource
// - namespaced layout
// - destructable layout, datasource

class LzPanelClass {
    #identifier
    #namespace_symbol
    #layout
    #datasource
    constructor(lzLayout, lzDataSource, shared_field) {
        this.#layout = lzLayout;
        this.#datasource = lzDataSource;
        if (typeof binder === 'string') {
            this.initialize(shared_field);
        } else {
            console.warn('Remember to bind the lazyout and datasource together with `initialize()`');
        }
    }
    initialize(shared_field) {
        this.#identifier = idCounter.getUniqueId();
        this.#namespace_symbol = `${shared_field}_${this.#identifier}`;
        this.#layout = lzLayout.withNamespace(shared_field, this.#namespace_symbol);
        this.#datasource = lzDataSource.withName(this.#namespace_symbol);
    }
    get full() {
        return {
            layout: this.#layout.full(),
            datasource: this.#datasource.full()
        }
    }
}

new LzPanelClass(
    new LzLayout('associations_catalog'),
    new LzDataSource(BioIndexDataSource, {
        index: 'associations-index',
        firstParam: `${phenotype}`,
    }),
    'assoc'
)

new LzPanelClass(
    new LzLayout('associations_catalog'),
    new LzDataSource('BioindexDatasource', {
        index: 'associations',
        // indexes the query string
        firstParam: `${phenotype}`,
        // overrides region information for query
        // secondParam: ``
    }),
    'assoc'
)

const layout = new LzLayout('associations_catalog')
    .addFields('assoc', ['pvalue', 'fold' /* etc */]);

const datasource = new LzDataSource(BioIndexDataSource)
    .withParams({ index: 'associations', firstParam: `${phenotype}` });

const associations_panel = new LzPanelClass(layout, datasource).initialize('assoc');