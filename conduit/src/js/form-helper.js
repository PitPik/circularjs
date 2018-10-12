define('form-helper', [], () => {
  const formHelpers = {
    parse: (formElements, arrays) => {
      const formData = {};

      formElements.forEach(elm => {
        elm.setAttribute('disabled', true);
        if(elm.name) { // TODO: client side validation
          formData[elm.name] = !elm.value ? null : elm.value.trim();
          if (arrays.indexOf(elm.name) !== -1 && formData[elm.name]) {
            formData[elm.name] = formData[elm.name].split(/,*\s(?:\s*,\s*)*\s*/);
          }
        }
      });

      return formData;
    },
    error: (error, errorComponent, formElements) => {
      const messages = JSON.parse(error.response);
      const out = [];
      const errors = Object.keys(messages.errors).forEach(key => {
        messages.errors[key].forEach(msg => {
          out.push({ message: `${key} ${msg}` });
        })
      });

      errorComponent.reset(out);
      formHelpers.enableForm(formElements);
    },
    enableForm: (formElements, reset) => {
      formElements.forEach(elm => {
        elm.removeAttribute('disabled');
        if (reset) {
          elm.value = '';
        }
      });
    },
  };

  return formHelpers;
});
