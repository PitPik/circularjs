require([], () => ({
  processErrors: (error) => {
    const messages = JSON.parse(error.response);

    return Object.keys(messages.errors).map(key => {
      return messages.errors[key].map(msg => {
        return { message: `${key} ${msg}` };
      })[0];
    });
  },
  getFormData: (form) => {
    const payload = {};
    for (var n = form.length; n--; ) {
      if (form[n].hasAttribute('name')) payload[form[n].name] = form[n].value.trim();
    }
    return payload;
  },
  resetForm: (form) => {
    for (var n = form.length; n--; ) {
      if (form[n].value) form[n].value = '';
    }
  },
  toggleForm: (form, toggle) => {
    for (var n = form.length; n--; ) {
      if (toggle) {
        form[n].setAttribute('disabled', true);
      } else {
        form[n].removeAttribute('disabled');
      }
    }
  }
}));