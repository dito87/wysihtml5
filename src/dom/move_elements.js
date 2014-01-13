wysihtml5.dom.moveElements = function(to, elements) {
  for(var i = 0; i < elements.length; i++) {
    var element = elements[i];
    to.appendChild(element.parentNode.removeChild(element));
  }
};