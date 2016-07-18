// first, remove configuration entry in case service is already configured
ServiceConfiguration.configurations.remove({
  service: "google"
});
ServiceConfiguration.configurations.insert({
  service: "google",
  clientId: "411682799732-r38hgfr9nlh0c0udigt4ln23ma8db93k.apps.googleusercontent.com",
  loginStyle: "popup",
  secret: "YCP43OPc_-tGlVqvj-o-hbu1"
});