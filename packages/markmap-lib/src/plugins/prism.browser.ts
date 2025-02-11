import { loadJS } from 'markmap-common';
import { ITransformHooks } from '../types';
import { definePlugin } from './base';
import config from './prism.config';

let loading: Promise<void>;
const autoload = () => {
  loading ||= loadJS(config.preloadScripts);
  return loading;
};

function loadLanguageAndRefresh(lang: string, transformHooks: ITransformHooks) {
  autoload().then(() => {
    window.Prism.plugins.autoloader.loadLanguages([lang], () => {
      transformHooks.retransform.call();
    });
  });
}

const name = 'prism';

export default definePlugin({
  name,
  config,
  transform(transformHooks: ITransformHooks) {
    let enableFeature = () => {};
    transformHooks.parser.tap((md) => {
      md.set({
        highlight: (str, lang) => {
          enableFeature();
          const { Prism } = window;
          const grammar = Prism?.languages?.[lang];
          if (!grammar) {
            loadLanguageAndRefresh(lang, transformHooks);
            return '';
          }
          return Prism.highlight(str, grammar, lang);
        },
      });
    });
    transformHooks.beforeParse.tap((_, context) => {
      enableFeature = () => {
        context.features[name] = true;
      };
    });
    return {
      styles: config.styles,
    };
  },
});
