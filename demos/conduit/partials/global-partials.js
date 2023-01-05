define('global-partials', ['schnauzer', '!global-partials.html'],
(Schnauzer, template) => {
  const globalPartials = new Schnauzer(template).partials;
  delete globalPartials.self;
  return globalPartials;
});
