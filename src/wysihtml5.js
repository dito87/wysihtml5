/**
 * @license wysihtml5 v@VERSION
 * https://github.com/xing/wysihtml5
 *
 * Author: Christopher Blum (https://github.com/tiff)
 *
 * Copyright (C) 2012 XING AG
 * Licensed under the MIT license (MIT)
 *
 */
var wysihtml5 = {
  version: "@VERSION",
  
  // namespaces
  commands:   {},
  dom:        {},
  quirks:     {},
  toolbar:    {},
  lang:       {},
  selection:  {},
  views:      {},
  
  INVISIBLE_SPACE: "\uFEFF",
  
  EMPTY_FUNCTION: function() {},
  
  ELEMENT_NODE: 1,
  TEXT_NODE:    3,
  
  BACKSPACE_KEY:  8,
  ENTER_KEY:      13,
  SHIFT_KEY:      16,
  CTRL_KEY:       17,
  ESCAPE_KEY:     27,
  SPACE_KEY:      32,
  DELETE_KEY:     46,
  META_KEYS:      [224, 17, 91, 93],
  ARROW_KEYS:     [37, 38, 39, 40],
  LEFT_ARROW_KEY: 37,
  UP_ARROW_KEY:   38,
  RIGHT_ARROW_KEY:39,
  DOWN_ARROW_KEY: 40
};