/**
 * Inspired by the rangy CSS Applier module written by Tim Down and licensed under the MIT license.
 * http://code.google.com/p/rangy/
 *
 * changed in order to be able ...
 *    - to use custom tags
 *    - to detect and replace similar css classes via reg exp
 */
(function(wysihtml5, rangy) {
  var defaultTagName = "span";
  
  var REG_EXP_WHITE_SPACE = /\s+/g;
  
  function hasClass(el, cssClass, regExp) {
    if (!el.className) {
      return false;
    }
    
    var matchingClassNames = el.className.match(regExp) || [];
    return matchingClassNames[matchingClassNames.length - 1] === cssClass;
  }

  function addClass(el, cssClass, regExp) {
    if (el.className) {
      removeClass(el, regExp);
      el.className += " " + cssClass;
    } else {
      el.className = cssClass;
    }
  }

  function removeClass(el, regExp) {
    if (el.className) {
      el.className = el.className.replace(regExp, "");
    }
  }
  
  function getClasses(el) {
    if(!el) {
      return [];
    }
    var element = getElementForTextNode(el);
    return element.className.split(" ");
  }
  
  function hasSameClasses(el1, el2) {
    var 
      el1ClassList = el1.className.split(" "),
      el2ClassList = el2.className.split(" ");
      
    if(el1ClassList.length !== el2ClassList.length) {
      return false;
    }
    
    for(var i = 0; i < el1ClassList.length; i++) {
      if(el2ClassList.indexOf(el1ClassList[i]) < 0) {
        return false;
      }
    }
    
    return true;
  }
  
  function getElementForTextNode(el) {
    return el.nodeType === wysihtml5.ELEMENT_NODE ? el : el.parentNode;
  }
  
  function remove(el) {
    el.parentNode.removeChild(el);
  }

  function elementsHaveSameNonClassAttributes(el1, el2) {
    if (el1.attributes.length != el2.attributes.length) {
      return false;
    }
    for (var i = 0, len = el1.attributes.length, attr1, attr2, name; i < len; ++i) {
      attr1 = el1.attributes[i];
      name = attr1.name;
      if (name != "class") {
        attr2 = el2.attributes.getNamedItem(name);
        if (attr1.specified != attr2.specified) {
          return false;
        }
        if (attr1.specified && attr1.nodeValue !== attr2.nodeValue) {
          return false;
        }
      }
    }
    return true;
  }

  function splitNodeAt(node, descendantNode, descendantOffset) {
    var newNode;
    if (rangy.dom.isCharacterDataNode(descendantNode)) {
      if (descendantOffset == 0) {
        descendantOffset = rangy.dom.getNodeIndex(descendantNode);
        descendantNode = descendantNode.parentNode;
      } else if (descendantOffset == descendantNode.length) {
        descendantOffset = rangy.dom.getNodeIndex(descendantNode) + 1;
        descendantNode = descendantNode.parentNode;
      } else {
        newNode = rangy.dom.splitDataNode(descendantNode, descendantOffset);
      }
    }
    if (!newNode) {
      newNode = descendantNode.cloneNode(false);
      if (newNode.id) {
        newNode.removeAttribute("id");
      }
      var child;
      while ((child = descendantNode.childNodes[descendantOffset])) {
        newNode.appendChild(child);
      }
      rangy.dom.insertAfter(newNode, descendantNode);
    }
    return (descendantNode == node) ? newNode : splitNodeAt(node, newNode.parentNode, rangy.dom.getNodeIndex(newNode));
  }
  
  function splitBoundaries(range) {
    if(range.collapsed) {
      var textNode = range.startContainer;
      if(textNode.nodeType !== wysihtml5.TEXT_NODE) {
        textNode.innerHTML = wysihtml5.INVISIBLE_SPACE;
        textNode = textNode.firstChild;
      }
      
      var 
        parent = textNode.parentNode,
        newNode = splitNodeAt(parent, textNode, range.startOffset),
        cloneNode = newNode.cloneNode();

      cloneNode.innerHTML = wysihtml5.INVISIBLE_SPACE;
      range.collapseBefore(newNode);
      range.insertNode(cloneNode);
      range.selectNode(cloneNode.firstChild);
      range.collapse();

      return;
    } else {
      range.splitBoundaries();
      var nodes = removeUnselectedBoundaryTextNodes(range, range.getNodes([wysihtml5.TEXT_NODE]));  
      for(var i = 0; i < nodes.length; i++) {
        var 
          parent = nodes[i].parentNode,
          node = createNode(parent, nodes[i].data);

        // Remove orphaned nodes
        if(parent.parentNode === null) {
          remove(nodes[i]);
          continue;
        }
        
        insertBefore(parent, node);

        if(nodes[i].previousSibling !== null && nodes[i].previousSibling.data !== undefined) {
          var prev = createNode(parent, nodes[i].previousSibling.data);
          insertBefore(node, prev);
        }

        if(nodes[i].nextSibling !== null && nodes[i].nextSibling.data !== undefined) {
          var next = createNode(parent, nodes[i].nextSibling.data);
          insertAfter(node, next);
        }

        remove(parent);
        
        if(i === 0) {
          range.setStartBefore(node);
        }

        if(i === nodes.length - 1) {
          range.setEndAfter(node);
        }   
      }
    }

    function createNode(parent, text) {
      var el = parent.cloneNode();
      el.innerHTML = text;
      return el;
    }

    function insertBefore(ref, node) {
      ref.parentNode.insertBefore(node, ref);
    }

    function insertAfter(ref, node) {
      ref.parentNode.insertBefore(node, ref.nextSibling);
    }
  }
  
  function removeUnselectedBoundaryTextNodes(range, textNodes) {
     if(!range.collapsed && range.startOffset === textNodes[0].length) {
       textNodes.splice(0,1);
     }
     if(!range.collapsed && range.endOffset === 0) {
       textNodes.splice(textNodes.length - 1, 1);
     }
     return textNodes;
   }

  function Merge(firstNode) {
    this.isElementMerge = (firstNode.nodeType == wysihtml5.ELEMENT_NODE);
    this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
    this.textNodes = [this.firstTextNode];
  }

  Merge.prototype = {
    doMerge: function() {
      var textBits = [], textNode, parent, text;
      for (var i = 0, len = this.textNodes.length; i < len; ++i) {
        textNode = this.textNodes[i];
        parent = textNode.parentNode;
        textBits[i] = textNode.data;
        if (i) {
          parent.removeChild(textNode);
          if (!parent.hasChildNodes()) {
            parent.parentNode.removeChild(parent);
          }
        }
      }
      this.firstTextNode.data = text = textBits.join("");
      return text;
    },

    getLength: function() {
      var i = this.textNodes.length, len = 0;
      while (i--) {
        len += this.textNodes[i].length;
      }
      return len;
    },

    toString: function() {
      var textBits = [];
      for (var i = 0, len = this.textNodes.length; i < len; ++i) {
        textBits[i] = "'" + this.textNodes[i].data + "'";
      }
      return "[Merge(" + textBits.join(",") + ")]";
    }
  };

  function HTMLApplier(tagNames, cssClass, similarClassRegExp, normalize, toggable) {
    this.tagNames = tagNames || [defaultTagName];
    this.cssClass = cssClass || "";
    this.similarClassRegExp = similarClassRegExp;
    this.normalize = normalize;
    this.applyToAnyTagName = false;
    this.toggable = toggable === undefined ? true : toggable;
  }

  HTMLApplier.prototype = {
    getAncestorWithClass: function(node) {
      var cssClassMatch;
      while (node) {
        cssClassMatch = this.cssClass ? hasClass(node, this.cssClass, this.similarClassRegExp) : true;
        if (node.nodeType == wysihtml5.ELEMENT_NODE && rangy.dom.arrayContains(this.tagNames, node.tagName.toLowerCase()) && cssClassMatch) {
          return node;
        }
        node = node.parentNode;
      }
      return false;
    },

    // Normalizes nodes after applying a CSS class to a Range.
    postApply: function(textNodes, range) {
      var 
        firstNode = textNodes[0], 
        lastNode = textNodes[textNodes.length - 1],
        rangeClone = range.cloneRange(),
        merges = [], 
        currentMerge,
        rangeStartNode = firstNode, 
        rangeEndNode = lastNode,
        rangeStartOffset = 0, 
        rangeEndOffset = lastNode.length;

      var textNode, precedingTextNode;

      for (var i = 0, len = textNodes.length; i < len; ++i) {
        textNode = textNodes[i];
        precedingTextNode = this.getAdjacentMergeableTextNode(textNode.parentNode, false);
        if (precedingTextNode) {
          if (!currentMerge) {
            currentMerge = new Merge(precedingTextNode);
            merges.push(currentMerge);
          }
          currentMerge.textNodes.push(textNode);
          if (textNode === firstNode) {
            rangeStartNode = currentMerge.firstTextNode;
            rangeStartOffset = rangeStartNode.length;
          }
          if (textNode === lastNode) {
            rangeEndNode = currentMerge.firstTextNode;
            rangeEndOffset = currentMerge.getLength();
          }
        } else {
          currentMerge = null;
        }
      }
      
      // Test whether the first node after the range needs merging
      var nextTextNode = this.getAdjacentMergeableTextNode(lastNode.parentNode, true);
      if (nextTextNode) {
        if (!currentMerge) {
          currentMerge = new Merge(lastNode);
          merges.push(currentMerge);
        }
        currentMerge.textNodes.push(nextTextNode);
      }
      
      this.removeEmptySiblings(firstNode, lastNode);

      // Do the merges
      if (merges.length) {
        for (i = 0, len = merges.length; i < len; ++i) {
          merges[i].doMerge();
        }
        // Set the range boundaries
        range.setStart(rangeStartNode, rangeStartOffset);
        range.setEnd(rangeEndNode, rangeEndOffset);
                
        // collapse range if it was collapsed before merge
        if(rangeClone.collapsed) {
          range.collapse();
        }
      }
    },
    
    removeEmptySiblings: function(firstNode, lastNode) {
      var 
        nodes = [
          firstNode,
          lastNode ? lastNode : firstNode
        ],
        siblings = ["previousElementSibling", "nextElementSibling"];
      
      for(var i = 0; i < nodes.length; i++) {
        var sibling = nodes[i].parentNode[siblings[i]];
        while(sibling !== null) {
          var current = sibling;
          sibling = sibling[siblings[i]];

          var content = current.innerHTML;
          if(content.trim().length <= 0) {
            remove(current);
          }
        }
      }
    },
    
    getAdjacentMergeableTextNode: function(node, forward) {
        var isTextNode = (node.nodeType == wysihtml5.TEXT_NODE);
        var el = isTextNode ? node.parentNode : node;
        var adjacentNode;
        var propName = forward ? "nextSibling" : "previousSibling";
        if (isTextNode) {
          // Can merge if the node's previous/next sibling is a text node
          adjacentNode = node[propName];
          if (adjacentNode && adjacentNode.nodeType == wysihtml5.TEXT_NODE) {
            return adjacentNode;
          }
        } else {
          // Compare element with its sibling
          adjacentNode = el[propName];
          if (adjacentNode && this.areElementsMergeable(node, adjacentNode)) {
            return adjacentNode[forward ? "firstChild" : "lastChild"];
          }
        }
        return null;
    },
    
    areElementsMergeable: function(el1, el2) {
      return rangy.dom.arrayContains(this.tagNames, (el1.tagName || "").toLowerCase())
        && rangy.dom.arrayContains(this.tagNames, (el2.tagName || "").toLowerCase())
        && hasSameClasses(el1, el2)
        && elementsHaveSameNonClassAttributes(el1, el2);
    },

    createContainer: function(doc, ancestor) {
      var 
        el = doc.createElement(this.tagNames[0]),
        parentClasses = getClasses(ancestor);
      if (this.cssClass) {
        el.className = this.cssClass;
      }
      
      for(var i = 0; i < parentClasses.length; i++) {
        if(!parentClasses[i].match(this.similarClassRegExp)) {
          el.className += " " + parentClasses[i];
        }
      }
      
      return el;
    },

    isRemovable: function(el) {
      var 
        isContaining = rangy.dom.arrayContains(this.tagNames, el.tagName.toLowerCase()),
        isSameClass = wysihtml5.lang.string(el.className).trim() === this.cssClass;

      return isContaining && isSameClass;
    },
    
    applyToRange: function(range) {
      var nodes = [];
      splitBoundaries(range);
      if(range.collapsed) {
        nodes = [range.commonAncestorContainer];
      }
      else {
        nodes = range.getNodes([wysihtml5.ELEMENT_NODE], function(node) {
          return node.nodeName === "SPAN";
        });
      }
      
      for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].className.indexOf(this.cssClass) < 0) {
          addClass(nodes[i], this.cssClass);
        }
      }
      
      if (this.normalize) {
        var textNodes = this.extractTextNodes(nodes);
        this.postApply(textNodes, range);
      }
    },
    
    undoToRange: function(range) {
      var nodes = [];
      if(range.collapsed && range.commonAncestorContainer.nodeType === wysihtml5.ELEMENT_NODE) {
        // node is empty
        var node = range.commonAncestorContainer;
        node.className = node.className.replace(this.cssClass, "");
        nodes = [node];
      }
      else if(range.collapsed && range.commonAncestorContainer.nodeType === wysihtml5.TEXT_NODE) {
        var 
          node = getElementForTextNode(range.commonAncestorContainer),
          clone = node.cloneNode();
  
        clone.innerHTML = wysihtml5.INVISIBLE_SPACE;
        clone.className = clone.className.replace(this.cssClass, "");
        range.collapseAfter(node);
        range.insertNode(clone);
        range.selectNode(clone.firstChild);
        range.collapse();
        nodes = [clone];
      }
      else {
        splitBoundaries(range);
        nodes = range.getNodes([wysihtml5.ELEMENT_NODE]);
        
        for(var i = 0; i < nodes.length; i++) {
          nodes[i].className = nodes[i].className.replace(this.cssClass, "");
        }
      }
      
      if (this.normalize) {
        var textNodes = this.extractTextNodes(nodes);
        this.postApply(textNodes, range);
      }
    },
    
    extractTextNodes: function(nodes) {
      var textNodes = [];
        
      for(var i = 0; i < nodes.length; i++) {
        for(var j = 0; j < nodes[i].childNodes.length; j++) {
          if(nodes[i].childNodes[j].nodeType === wysihtml5.TEXT_NODE) {
            textNodes.push(nodes[i].childNodes[j]);
          }
        }
      }
        
      return textNodes;
    },

    selectNode: function(range, node) {
      var isElement       = node.nodeType === wysihtml5.ELEMENT_NODE,
          canHaveHTML     = "canHaveHTML" in node ? node.canHaveHTML : true,
          content         = isElement ? node.innerHTML : node.data,
          isEmpty         = (content === "" || content === wysihtml5.INVISIBLE_SPACE);

      if (isEmpty && isElement && canHaveHTML) {
        // Make sure that caret is visible in node by inserting a zero width no breaking space
        try { node.innerHTML = wysihtml5.INVISIBLE_SPACE; } catch(e) {}
      }
      range.selectNodeContents(node);
      if (isEmpty && isElement) {
        range.collapse(false);
      } else if (isEmpty) {
        range.setStartAfter(node);
        range.setEndAfter(node);
      }
    },
    
    getTextSelectedByRange: function(textNode, range) {
      var textRange = range.cloneRange();
      textRange.selectNodeContents(textNode);

      var intersectionRange = textRange.intersection(range);
      var text = intersectionRange ? intersectionRange.toString() : "";
      textRange.detach();

      return text;
    },

    isAppliedToRange: function(range) {
      var ancestors = [],
          ancestor,
          textNodes = range.getNodes([wysihtml5.TEXT_NODE]);
      if (!textNodes.length) {
        ancestor = this.getAncestorWithClass(range.startContainer);
        return ancestor ? [ancestor] : false;
      }
      
      for (var i = 0, len = textNodes.length, selectedText; i < len; ++i) {
        selectedText = this.getTextSelectedByRange(textNodes[i], range);
        ancestor = this.getAncestorWithClass(textNodes[i]);
        if (selectedText != "" && !ancestor) {
          return false;
        } else {
          ancestors.push(ancestor);
        }
      }
      return ancestors;
    },

    toggleRange: function(range) {
      if (this.isAppliedToRange(range) && this.toggable) {
        this.undoToRange(range);
      } else {
        this.applyToRange(range);
      }
    }
  };

  wysihtml5.selection.HTMLApplier = HTMLApplier;
  
})(wysihtml5, rangy);