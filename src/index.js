let xml;

(async function() {
  let response = await fetch("./assets/index.xml");
  let text = await response.text();
  let parser = new DOMParser();
  xml = parser.parseFromString(text, "text/xml");
  (async function structure() {
    function struct(root, cb) {
      let json = "{";
      function struct_sub(root) {
        if (root.children.length !== 0) {
          json +=
            '"' +
            root.nodeName +
            (root.attributes && root.attributes.id
              ? "[" + root.attributes.id.nodeValue + "]"
              : "") +
            '"' +
            ": {";
          [...root.children].forEach(el => struct_sub(el));
          json = json.slice(0, json.length - 2);
          json += "}";
        } else {
          json +=
            '"' + root.nodeName + '"' + ": " + '"' + root.innerHTML.replace(/\n|[ ]+/gm, " ") + '"';
        }
        json += ", ";
      }
      struct_sub(root);
      json = json.slice(0, json.length - 2);
      json += "}";
      return json;
    }
    console.log(struct(xml));
    console.log(JSON.parse(struct(xml)));
    document.getElementById("structure").innerText = JSON.stringify(JSON.parse(struct(xml)));
  })();

  (function info() {
    function count(root, cb) {
      let count = 0;
      function count_sub(root, cb) {
        count = cb(root, count);
        if (root.children.length !== 0) {
          [...root.children].forEach(el => count_sub(el, cb));
        }
      }
      count_sub(root, cb);
      return count;
    }
    let cnt = count(xml, (root, count) => count + root.children.length);
    let attrs = count(xml, (root, count) => (root.attributes ? count + root.attributes.length : 0));
    let max = count(xml, (root, count) =>
      count < root.children.length ? root.children.length : count
    );
    let output = `Document contains: ${cnt} elements;
    <br/> Elements contains: ${attrs} attributes;
    <br/> Maximum children: ${max}`;
    document.getElementById("info").innerHTML = output;
  })();

  (function find() {
    function search(root, cb) {
      let found = [];
      function search_sub(root, cb) {
        if (cb(root)) {
          found.push(root);
        }
        if (root.children.length !== 0) {
          [...root.children].forEach(el => search_sub(el, cb));
        }
      }
      search_sub(root, cb);
      return found;
    }

    document.getElementById("find_byname").addEventListener("click", e => {
      let elem = search(xml, root => root.nodeName === document.getElementById("name").value);
      if (elem) {
        document.getElementById("other_results2").innerHTML += `Found ${elem.length} elements`;
        elem.forEach((elem, i) => {
          diagram(elem, "result");

          document.getElementById("other_results").innerHTML += "<div class='divided'></div>";
          document.getElementById("other_results").children[i].innerText += elem.outerHTML;
        });
      }
    });
    document.getElementById("find_byattr").addEventListener("click", e => {
      let elem = search(xml, root =>
        root.attributes
          ? (root.attributes[document.getElementById("attr").value]
              ? root.attributes[document.getElementById("attr").value].nodeValue
              : "") === document.getElementById("val").value
          : false
      );
      if (elem) {
        document.getElementById("other_results2").innerHTML += `Found ${elem.length} elements`;
        elem.forEach((elem, i) => {
          diagram(elem, "result2");

          document.getElementById("other_results2").innerHTML += "<div class='divided'></div>";
          document.getElementById("other_results2").children[i].innerText += elem.outerHTML;
        });
      }
    });
  })();

  function diagram(xml, container) {
    var graph = new joint.dia.Graph();

    var paper = new joint.dia.Paper({
      el: document.getElementById(container),
      model: graph,
      width: "auto",
      height: "auto",
      gridSize: 1
    });

    paper.scale(0.8, 0.8);
    var rect = new joint.shapes.standard.Rectangle();
    rect.position(500, 30);
    rect.resize(100, 40);
    rect.attr({
      body: {
        fill: "#c4c4ff",
        stroke: "#1212ff"
      },
      label: {
        text: xml.nodeName,
        fill: "#1212ff"
      }
    });
    rect.addTo(graph);
    function draw(root, xml, prev_offset) {
      let curr = root.clone();
      let offset = xml.parentNode ? (xml.parentNode.children.length * (100 + 10)) / 2 : 0;
      if (offset < prev_offset) {
        offset = prev_offset;
      }
      if (xml.parentNode && xml.parentNode.children.length === 1) {
        offset = -prev_offset;
      }
      curr.translate(-1 * offset + prev_offset, 100);
      if (xml.children.length === 0) {
        curr = curr.clone();
        curr.attributes.attrs.body.fill = "#ffffff";
        curr.position(root.attributes.position.x, root.attributes.position.y + 100);
        curr.attr("label/text", "text node");
        curr.addTo(graph);
        var link = new joint.shapes.standard.Link();
        link.source(root);
        link.target(curr);
        link.addTo(graph);
        return;
      }
      [...xml.children].forEach((el, i, arr) => {
        if (arr[i - 1] && el.nodeName === arr[i - 1].nodeName) {
          return;
        }

        if (i !== 0) {
          curr = curr.clone();
          curr.translate(120, 0);
        }
        curr.attr("label/text", el.nodeName);
        curr.addTo(graph);
        var link = new joint.shapes.standard.Link();
        link.source(root);
        link.target(curr);
        link.addTo(graph);
        draw(curr, el, offset);
      });
    }
    draw(rect, xml, 0, 0);
  }
  diagram(xml, "diag");
  document.getElementById("diag").getElementsByTagName("svg")[0].style.overflow = "scroll";
})();
