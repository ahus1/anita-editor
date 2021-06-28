import { getDefaultWhiteList } from 'xss/lib/default';

const xssOptions = {
  whiteList: getDefaultWhiteList(),
  onIgnoreTag(tag) {
    console.log(`ignoring tag "${tag}' as it is not on the whitelist`);
  },
  onIgnoreTagAttr(tag, name, value) {
    console.log(`ignoring tag/attr "${tag}/${name}" with value "${value}" as it is not on the whitelist`);
  },
};

// allow ID, title and class for all elements on the whitelist
Object.keys(xssOptions.whiteList).forEach((key) => xssOptions.whiteList[key].push('id', 'title', 'class'));

xssOptions.whiteList.ol.push('type');
xssOptions.whiteList.ol.push('reversed');
xssOptions.whiteList.ol.push('start');
xssOptions.whiteList.ul.push('type');
xssOptions.whiteList.code.push('data-lang');
xssOptions.whiteList.i.push('data-value');
xssOptions.whiteList.a.push('rel');
xssOptions.whiteList.kbd = [];

// columns have a setting of the width style, therefore allow style
xssOptions.whiteList.col.push('style');

export default xssOptions;
