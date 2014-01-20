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
      var 
        nodes = removeUnselectedBoundaryTextNodes(range, range.getNodes([wysihtml5.TEXT_NODE])),
        firstNode = undefined,
        lastNode = undefined;  
      
      // ugly hack if first text node is empty
      if(nodes[0] && nodes[0].data.trim().length <= 0) {
        nodes.splice(0,1);
      }
      
      for(var i = 0; i < nodes.length; i++) {              
        var 
          styleParent = findStyleParent(nodes[i]),
          innerHtml = styleParent === nodes[i].parentNode ? nodes[i].data : styleParent.innerHTML,
          node = createNode(styleParent, innerHtml);

        insertBefore(styleParent, node);

        if(nodes[i].previousSibling !== null && nodes[i].previousSibling.data !== undefined) {
          var prev = createNode(styleParent, nodes[i].previousSibling.data);
          insertBefore(node, prev);
        }

        if(nodes[i].nextSibling !== null && nodes[i].nextSibling.data !== undefined) {
          var next = createNode(styleParent, nodes[i].nextSibling.data);
          insertAfter(node, next);
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
    
    function createNode(parent, innerHtml) {
      var el = parent.cloneNode();
      el.innerHTML = innerHtml;
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
    if(!range.collapsed && range.startOffset === textNodes[0].length) {
      textNodes.splice(0,1);
    }
    if(!range.collapsed && range.endOffset === 0) {
      textNodes.splice(textNodes.length - 1, 1);
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