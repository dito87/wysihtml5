wysihtml5.commands.insertUnorderedList = {
  exec: function(composer, command, style) {
    var STYLE_REG_EXP = /wysiwyg-list-style-[0-9a-f\-]+/g;
    
    var doc           = composer.doc,
        selectedNode  = composer.selection.getSelectedNode(),
        list          = wysihtml5.dom.getParentElement(selectedNode, { nodeName: "UL" }),
        otherList     = wysihtml5.dom.getParentElement(selectedNode, { nodeName: "OL" }),
        tempClassName =  "_wysihtml5-temp-" + new Date().getTime(),
        isEmpty,
        tempElement;
    
    /*
    if (!list && !otherList && composer.commands.support(command)) {
      doc.execCommand(command, false, null);
      return;
    }*/
    
    if (list && !this.compareStyle(list, style)) {
      list.className = list.className.replace(STYLE_REG_EXP, "");
      list.className = list.className + " wysiwyg-list-style-" + style;
    } else if (list) {
      // Unwrap list
      // <ul><li>foo</li><li>bar</li></ul>
      // becomes:
      // foo<br>bar<br>
      composer.selection.executeAndRestore(function() {
        wysihtml5.dom.resolveList(list, composer.config.useLineBreaks);
      });
    } else if (otherList) {
      // Turn an ordered list into an unordered list
      // <ol><li>foo</li><li>bar</li></ol>
      // becomes:
      // <ul><li>foo</li><li>bar</li></ul>
      composer.selection.executeAndRestore(function() {
        wysihtml5.dom.renameElement(otherList, "ul");
      });
    } else {
      // Create list
      composer.commands.exec("formatBlock", "div", tempClassName);
      tempElement = doc.querySelector("." + tempClassName);
      isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === wysihtml5.INVISIBLE_SPACE || tempElement.innerHTML === "<br>";
      composer.selection.executeAndRestore(function() {
        list = wysihtml5.dom.convertToList(tempElement, "ul");
        if(style) {
          list.className = list.className + " wysiwyg-list-style-" + style;
        }
      });
      if (isEmpty) {
        composer.selection.selectNode(list.querySelector("li"), true);
      }
    }
  },
  
  state: function(composer, command, style) {
    var 
      selectedNode = composer.selection.getSelectedNode(),
      list = wysihtml5.dom.getParentElement(selectedNode, { nodeName: "UL" });
    
    if(style) {
      return this.compareStyle(list, style);
    } else {
      return list;
    }
  },
  
  compareStyle: function(list, style) {
    return list && style && list.className.indexOf(style) > -1;  
  }
};