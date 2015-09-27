import recase from 'change-case';
import _ from 'lodash';

const stylesOpts = Symbol('stylesOpts');

function extractKeyframes(keyframe, prefix) {
  const rulesKeyframe = Object.keys(keyframe).map((attr) => {
    return `    ${prefix}${attr}: ${keyframe[attr]};`;
  }).join('\n');

  return `{\n${rulesKeyframe}\n  }`;
}

function extractStyle(selector, reactStyle, { prefix = '' } = {}) {
  const rules = Object.keys(reactStyle).map((attr) => {
    return selector.indexOf('@keyframes') > -1
    ? `  ${prefix}${attr} ${extractKeyframes(reactStyle[attr], prefix)}`
    : `  ${recase.paramCase(attr)}: ${reactStyle[attr]};`;
  }).join('\n');
  return `${prefix}${selector} {\n${rules}\n}`;
}

function createCSSString(displayName, stylesObj, options) {
  return `/* @react-statics-styles ${displayName} */\n${Object.keys(stylesObj)
    .map((selector) => extractStyle(selector, stylesObj[selector], options))
  .join('\n')}\n`;
}

function extractStyles(Component) {
  if(!_.isObject(Component) ||
      !Component.styles ||
      !_.isObject(Component.styles)) {
    return null;
  }
  return createCSSString(Component.displayName, Component.styles, Component[stylesOpts]);
}

function extractAllStyles(Components) {
  return _.without(_.map(Components, extractStyles), null).join('\n');
}

function injectStyles(Component, newStyles, options) {
  const stylesObj = Object.assign({}, Component.styles || {}, newStyles);
  const cssString = createCSSString(Component.displayName, stylesObj, options);
  let stylesheet = document.querySelector(`style.dev-css-${Component.displayName}`);
  if(!stylesheet) {
    stylesheet = document.createElement('STYLE');
    stylesheet.className = `dev-css-${Component.displayName}`;
    document.head.appendChild(stylesheet);
  }
  stylesheet.innerHTML = cssString;
}

function styles(newStyles, opts) {
  return (Component) => {
    if(process.browser && process.env.NODE_ENV !== 'production') {
      injectStyles(Component, newStyles, opts);
      return Component;
    }
    return Object.assign(class extends Component {
      static styles = Object.assign({}, Component.styles || {}, newStyles);
    }, { [stylesOpts]: opts });
  };
}

export default { extractStyle, extractStyles, extractAllStyles, styles, stylesOpts };
