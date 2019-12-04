const Prismic = require('prismic-javascript');
const PrismicDOM = require('prismic-dom');
const request = require('request');
const PrismicConfig = require('./prismic-configuration');
const Onboarding = require('./onboarding');
const app = require('./config');

const PORT = app.get('port');

app.listen(PORT, () => {
  Onboarding.trigger();
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
});

// Middleware to inject prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: PrismicConfig.apiEndpoint,
    linkResolver: PrismicConfig.linkResolver,
  };
  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM;
  Prismic.api(PrismicConfig.apiEndpoint, {
    accessToken: PrismicConfig.accessToken,
    req,
  }).then((api) => {
    req.prismic = { api };
    next();
  }).catch((error) => {
    next(error.message);
  });
});

app.get('/page/:uid', (req, res, next) => {

  // We store the param uid in a variable
  const uid = req.params.uid;

  // We are using the function to get a document by its uid field
  req.prismic.api.getByUID('page', uid).then((document) => {

    // document is a document object, or null if there is no match
    if (document) {

      // Render the 'page' pug template file (page.pug)
      res.render('page', { document });

    } else {
      res.status(404).render('404');
    }
  }).catch((error) => {
    next(`error when retriving page ${error.message}`);
  });
})

/*
 * Homepage route
 */
app.get('/', (req, res, next) => {
  req.prismic.api.getSingle("homepage")
    .then((pageContent) => {
      if (pageContent) {
        res.render('homepage', { pageContent });
      } else {
        res.status(404).send('Could not find a homepage document. Make sure you create and publish a homepage document in your repository.');
      }
    })
    .catch((error) => {
      next(`error when retriving page ${error.message}`);
    });
});