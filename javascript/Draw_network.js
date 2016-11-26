var pre_data;
var nodes;
var edges;
var network;

$(function(){
  var jsonFilePath = 'tmp/topology.json';
  var EDGE_LENGTH = 150;
  

  var drawgraph = function(node_data, link_data){
    var options = {interaction:{dragNodes:false,multiselect:true}};
    nodes = new vis.DataSet(node_data);
    edges = new vis.DataSet(link_data);
    var container = document.getElementById('mynetwork');
    var data = {'nodes': nodes, 'edges': edges};
    network = new vis.Network(container, data, options);
network.setOptions(options);
    click();
  }

  var checkObjDiff = function(object1, object2) {
    // objectの中身をjson化する
    var object1String = JSON.stringify(object1); 
    var object2String = JSON.stringify(object2);
    // json文字列で比較する
    if (object1String === object2String) {
      return false; // 等しければfalse
    } else {
      return true; // 差分があればtrue
    }
  }

  var afterInit = function(jsonData) {
    console.log('afterInit', jsonData);
    var n_data = new Array();
    var l_data = new Array();
    var tmp = new Object();
    for(var i in jsonData[0].nodes){
       tmp = { id:+jsonData[0].nodes[i].id, label:jsonData[0].nodes[i].label, image: './switch.png', shape: 'image'};
       n_data.push( tmp );
    }
    for(var i in jsonData[0].hosts){
       tmp = { id:+jsonData[0].hosts[i].id, label:jsonData[0].hosts[i].label, image: './computer_laptop.png', shape: 'image'}
       n_data.push( tmp );
    }
    for(var i in jsonData[0].links){
       tmp = { id:+jsonData[0].links[i].id, from:jsonData[0].links[i].from, to:jsonData[0].links[i].to, length: EDGE_LENGTH}
       l_data.push( tmp );
    }
    drawgraph(n_data, l_data);
  };

  var getJsonData = function(filePath) {
    var defer = $.Deferred();
    $.ajax({
      type: 'GET',
      url: filePath,
      dataType: 'json',
      cache: false
    })
    .done(defer.resolve)
    .fail(defer.reject);
    return defer.promise();
  };

  var init = function() {
    getJsonData(jsonFilePath)
    .done(function(data) {
      console.log('取得成功', data);
      if (!checkObjDiff(pre_data, data)){
        return;
      }
      pre_data = data;
      afterInit(json = data);
    })
    .fail(function(jqXHR, statusText, errorThrown) {
      console.log('初期化失敗', jqXHR, statusText, errorThrown);
      // 1秒置いて再取得
      setTimeout(function() {
        init();
      }, 1000);
    });
  };
  setInterval(init,1000);
});

var click = function() {
  network.on("click", function (params) {
    console.log('click:', params)
    var path = new Array();
    var newColor = 'red';
    var oldColor = '#848484';
    var oldarrow = {to:false, from:false};
    if (typeof(params.nodes[0]) !== "undefined" && typeof(params.nodes[1]) === "undefined"){
    //ノードが一つだけ選択された場合，そのノードがsrcのパスを表示する
      console.log('one node:', params)
      for(var j in pre_data[0].links){//エッジの色を戻す
        edges.update([{id:pre_data[0].links[j].id, arrows:{to:{enabled:oldarrow.to}, from:{enabled:oldarrow.from}}, color:{color:oldColor,highlight:oldColor}}]);
      }
      for(var i in pre_data[0].paths){
        if (checkPath(pre_data[0].paths[i], pre_data[0].hosts, params.nodes[0])){
          path.push( pre_data[0].paths[i] );
          for(var j in pre_data[0].links){
            if (checkEdgeInPath(pre_data[0].links[j], pre_data[0].paths[i], pre_data[0].hosts)){//エッジの色を赤に
              var arrow = checkToFrom(pre_data[0].links[j], pre_data[0].paths[i], pre_data[0].hosts);
              edges.update([{id:pre_data[0].links[j].id, arrows:{to:{enabled:arrow.to}, from:{enabled:arrow.from}}, color:{color:newColor,highlight:newColor}}]);
            }
          }
        }
      }
    document.getElementById('eventSpan').innerHTML = '<h2>Path:</h2>' + JSON.stringify(path, null, 4);
    } else if(typeof(params.nodes[1]) !== "undefined" && typeof(params.nodes[2]) === "undefined"){
      console.log('two nodes:', params)
      path = [];
      var count = 0;
      //ノードが二つだけ選択された場合，その経路間のパスを示す
      for(var i in pre_data[0].paths){//全てのパスから検索
        if (checkPath(pre_data[0].paths[i], pre_data[0].hosts, params.nodes[0], params.nodes[1])){//srcとdestがあってるpathを処理
          count++;
          path.push( pre_data[0].paths[i] );
/*          for(var j=0; j<pre_data[0].paths[i].length; j++){//ノードの色を赤に(image使ってると意味なかった
            nodes.update([{id:pre_data[0].paths[i][j], color:{border:newColor,highlight:{border:newColor}}}]);
          }*/
          for(var j in pre_data[0].links){
            if (checkEdgeInPath(pre_data[0].links[j], pre_data[0].paths[i], pre_data[0].hosts)){//エッジの色を赤に
              var arrow = checkToFrom(pre_data[0].links[j], pre_data[0].paths[i], pre_data[0].hosts);
              if (count == 2){arrow = {to:true, from:true};}
console.log('two nodes:', count)
              edges.update([{id:pre_data[0].links[j].id, arrows:{to:{enabled:arrow.to}, from:{enabled:arrow.from}}, color:{color:newColor,highlight:newColor}}]);
            }else{
              edges.update([{id:pre_data[0].links[j].id, arrows:{to:{enabled:oldarrow.to}, from:{enabled:oldarrow.from}}, color:{color:oldColor,highlight:oldColor}}]);
            }
          }
        }
      }
      document.getElementById('eventSpan').innerHTML = '<h2>Path:</h2>' + JSON.stringify(path, null, 4);
    } else{
      //未定
    }
  });

  var checkPath = function(path, hosts, node1, node2) {
    var path_id = pathConvertedMacToId(path, hosts);
    if (typeof(node2) == "undefined"){//pathがnode1のパスか
      return (path_id[0] == node1)
    }else {//pathがnode1とnode2のパスか
      return ((path_id[0] == node1 && path_id[path_id.length-1] == node2) || (path_id[0] == node2 && path_id[path_id.length-1] == node1))
    }
  };

  var checkEdgeInPath = function(edge, path, hosts) {
    var path_id = pathConvertedMacToId(path, hosts);
    //edgeがpathに含まれているか
    for(var i=0; i<path_id.length-1; i++){
      if ((path_id[i] == edge.to && path_id[i+1] == edge.from) || (path_id[i+1] == edge.to && path_id[i] == edge.from)){
        return true;
      }
    }
    return false;
  };

  var pathConvertedMacToId = function(path, hosts) {
    //pathのMACをIDに変換して返す
　　　 var new_path = new Array(path.length);
    for(var i=0; i<hosts.length; i++){
      if( hosts[i].label == path[0] ){ new_path[0] = hosts[i].id; }
      if( hosts[i].label == path[path.length-1] ){ new_path[path.length-1] = hosts[i].id; }
    }
    for(var i=1; i<path.length-1; i++){
      new_path[i] = path[i];
    }
    return new_path;
  };

  var checkToFrom = function(edge, path, hosts) {
    var path_id = pathConvertedMacToId(path, hosts);
    var arrow = {to:false, from:false};
    for(var i=0; i<path_id.length-1; i++){
      if (path_id[i] == edge.from && path_id[i+1] == edge.to){
        arrow.to = true;
        return arrow;
      }else if(path_id[i] == edge.to && path_id[i+1] == edge.from){
        arrow.from = true;
        return arrow;
      }
    }
  };

};

