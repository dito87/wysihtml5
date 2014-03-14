/**
 * Split nodes
 */
(function(wysihtml5, rangy) {

  function splitBoundaries(range) {
    if(range.collapsed) {
      var 
        textNode = range.startContainer,
        startOffset = range.startOffset;
      
      if(textNode.nodeType !== wysihtml5.TEXT_NODE) {
        insertInvisibleSpaceIfEmpty(textNode, range);
        textNode = textNode.firstChild;
        startOffset = textNode.length;
      }

      var
        parent = textNode.parentNode,
        newNode = splitNodeAt(parent, textNode, startOffset),
        cloneNode = newNode.cloneNode();

      cloneNode.innerHTML = wysihtml5.INVISIBLE_SPACE;
      range.collapseBefore(newNode);
      range.insertNode(cloneNode);
      range.selectNode(cloneNode.firstChild);
      range.collapse();
      
      if(cloneNode.nextSibling) {
        insertInvisibleSpaceIfEmpty(cloneNode.nextSibling, range);        
      }
      
      return;
    } else {
      // TODO: Refactor the following part
      range.splitBoundaries();
      concatRangeTextNodes(range);
      range.refresh();
      var
        nodes = removeUnselectedBoundaryTextNodes(range, range.getNodes([wysihtml5.TEXT_NODE])),
        firstNode = undefined,
        lastNode = undefined;  
      
      for(var i = 0; i < nodes.length; i++) {              
        var 
          styleParent = findStyleParent(nodes[i]),
          textContent = styleParent === nodes[i].parentNode ? nodes[i].data : styleParent.textContent,
          node = createNode(styleParent, textContent);

        insertBefore(styleParent, node);

        var prevs = findSiblings(nodes[i], "previous");
        if(prevs.length > 0) {
          prevs.reverse();
          var text = prevs.map(function(v) {
            return v.data;
          }).join("");
          
          if(text.trim().length > 0) {
            insertBefore(node, createNode(styleParent, text));
          }
        }

        var nexts = findSiblings(nodes[i], "next");
        if(nexts.length > 0) {
          var text = nexts.map(function(v) {
            return v.data;
          }).join("");
          
          if(text.trim().length > 0) {
            insertAfter(node, createNode(styleParent, text));
          }
        }
        
        if(firstNode === undefined) {
          firstNode = node;
        }

        if(i === nodes.length - 1) {
          lastNode = node;
        }   
      }

      // remove old
      for(var i = 0; i < nodes.length; i++) {
        var styleParent = findStyleParent(nodes[i]);
        if(styleParent.parentNode !== null) {
          remove(styleParent);
        }
      }
      
      // set current range again
      range.setStartBefore(firstNode);
      range.setEndAfter(lastNode);
    }
    
    function createNode(parent, text) {
      var el = parent.cloneNode();
      el.textContent = text;
      return el;
    }

    function insertBefore(ref, node) {
      ref.parentNode.insertBefore(node, ref);
    }

    function insertAfter(ref, node) {
      ref.parentNode.insertBefore(node, ref.nextSibling);
    }
    
    function remove(el) {
      el.parentNode.removeChild(el);
    }
    
    function findStyleParent(node) {
      var 
        nodeName = "SPAN",
        parent = node.parentNode;
        
      while(parent !== null && parent.nodeName !== nodeName) {
        parent = parent.parentNode;
      }
      
      return parent;  
    }
    
    // concat nodes in a range that have the same parent
    function concatRangeTextNodes(range) {
      var nodes = removeUnselectedBoundaryTextNodes(range, range.getNodes([wysihtml5.TEXT_NODE]));
      
      for(var i = 1; i < nodes.length; i++) {
        var
          prev = nodes[i-1],
          current = nodes[i]
        
        if(prev.parentNode === current.parentNode) {
          current.data = prev.data += current.data;
          prev.parentNode.removeChild(prev); 
        }
      }
    }
    
    function findSiblings(node, dir) {
      var 
        direction = dir + "Sibling",
        siblings = [],
        sib = node[direction];

      while(sib) {
        siblings.push(sib);
        sib = sib[direction];
      }
      
      return siblings;
    }
  };
  
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
  };
  
  function removeUnselectedBoundaryTextNodes(range, textNodes) {
    // If there's only 1 or 0 text node we don't need to check boundaries.
    if (textNodes.length > 1) {
      var firstNode = textNodes[0]? textNodes[0].parentNode : [],
          lastNode = textNodes[textNodes.length - 1]? textNodes[textNodes.length - 1] : [],
          lastNodeCleanText = lastNode.length > 1? lastNode.wholeText.trim() : [];
      if(!range.collapsed && (firstNode.length > 1 || range.startOffset === textNodes[0].length)) {
        textNodes.splice(0,1);
      }
      if(!range.collapsed && (lastNodeCleanText.length > 1 && range.endOffset === 0)) {
        // Remove last text node if the content (trimmed) is longer than 1 character and the selection offset is 0.
        textNodes.splice(textNodes.length - 1, 1);
      }
    }
    return textNodes;
  };
   
  function insertInvisibleSpaceIfEmpty(node, range) {
    if(!node.firstChild) {
      node.innerHTML = wysihtml5.INVISIBLE_SPACE;
    }
    else if(node.firstChild.nodeType !== wysihtml5.TEXT_NODE) {
      var 
        doc = range.getDocument(),
        invisibleNode = doc.createTextNode(wysihtml5.INVISIBLE_SPACE);

      node.insertBefore(invisibleNode, node.firstChild);
    }
  }
  
  wysihtml5.dom.split = {
    splitBoundaries: splitBoundaries,
    splitNodeAt: splitNodeAt
  };
  
})(wysihtml5, rangy);