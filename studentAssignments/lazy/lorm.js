// LORM: A simple form validation check
// utility, created by (u/lazybind) and
// and (u/Earthsophagus).

class Lorm extends HTMLElement {
    #valid;
    #query;
    #defaultRegex;
    // Lorm: an extended <form> that
    // allow arbitrary HTTP verbs to
    // be issued and Regex checks to
    // be performed.
    constructor()
    {
        super();
        this.#defaultRegex = new Object();
        (this.#defaultRegex).text = '^[a-zA-Z]+$';
        (this.#defaultRegex).number = '^[0-9]+$';
        // Propagate the event to all
        // children of x-lorm Element.
        this.addEventListener('submit', (this.#passToChildren).bind(this));
        this.addEventListener('click', (event) => event.stopPropagation());
    }
    //
    connectedCallback()
    {
        const options = new Object();
        const observer = new MutationObserver((this.#parseMutation).bind(this));
        options['childList'] = true;
        options['attributes'] = false;
        observer.observe(this, options);
    }
    //
    #parseMutation(mutation, parent)
    {
        var children;
        var bound;
        //
        this.method = this.getAttribute('method');
        this.target = this.getAttribute('target');
        this.target = this.target ? document.querySelector(this.target) : null;
        //
        bound = this.#handleChild;
        bound = bound.bind(this);
        children = mutation.map(record => record.addedNodes[0]);
        children = children.filter(child => child.nodeType != Node.TEXT_NODE);
        children.forEach(child => bound(child));
    }
    //
    #passToChildren()
    {
        const children = Array.from(this.children);
        const event = new Event('submit');
        //
        this.#valid = true;
        this.#query = new URLSearchParams();
        this.action = this.getAttribute('action');
        (this.target).innerHTML = '';
        children.forEach(child => child.dispatchEvent(event));
    }
    //
    #handleChild(child)
    {
        var event;
        if (child.tagName != 'INPUT') return;
        event = new Event('submit');
        //
        switch (child.getAttribute('type'))
        {
            case 'submit':
            child.addEventListener('click', () => this.dispatchEvent(event));
            child.addEventListener('submit', (this.submitRequest).bind(this));
            break;
            default:
            child.addEventListener('submit', (this.#checkField).bind(this));
            break;
        }
    }
    //
    #checkField(event)
    {
        var target;
        var value;
        var regex;
        var name;
        var type;
        //
        target = event.currentTarget;
        regex = target.getAttribute('regex');
        name = target.getAttribute('name');
        type = target.getAttribute('type');
        value = target.value;
        //
        regex = regex ? regex : (this.#defaultRegex)[type];
        regex = new RegExp(regex);
        this.#valid &= regex.test(value);
        (this.#query).append(name, value);
    }
    //
    submitRequest()
    {
        if (! this.#valid) {
            if (this.target) (this.target).innerHTML =
                '<span style="background-color: red; ' +
                'color: white; padding: 2px;">' +
                'Invalid input.' +
                '</span>';
            return;
        }
        var request;
        var bound;
        bound = (this.#writeResponse).bind(this);
        request = new XMLHttpRequest();
        request.onload = () => bound(request);
        if (Array("GET", "HEAD").includes(this.method))
            this.action += '?' + (this.#query).toString();
        request.open(this.method ?? 'GET',
                     this.action ?? '');
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(this.#query);
    }
    //
    #writeResponse(request)
    {
        var response;
        if (! this.target) return;
        response = request.response;
        response = document.createTextNode(response);
        (this.target).append(response);
    }
}

customElements.define('x-lorm', Lorm);