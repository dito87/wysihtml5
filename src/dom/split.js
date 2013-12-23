/**
 * Split nodes
 */
(function(wysihtml5) {

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
    
    function remove(el) {
      el.parentNode.removeChild(el);
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
  
})(wysihtml5);