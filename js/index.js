var WIDTH =  $(window).width();
  var HEIGHT =  $(window).height();
 function rand(min, max)
 {
  return min + Math.round(Math.random() * (max - min));
 }
 function add()
 {
  
  var x = rand(0, WIDTH);
  var html = '<div class="divText" style="left:' + x + 'px; bottom:'+HEIGHT+'px;">';
  /*
  var color1 = [];
  var color2 = [];
  var color3 = [];
  var color4 = [];
  var color5 = [];
  var color6 = [];
  for (var i=1; i<17; i++)
  {
   var f = i.toString(16);
   color1.push('0' + f + '0');
   color2.push(f + '00');
   color3.push('00' + f);
   color4.push('0' + f + f);
   color5.push(f + f + '0');
   color6.push(f + '0' + f);
  }
  var color = [color1, color2, color3, color4, color5, color6];
  var ci = rand(0, 5);
  */
  var color = [];
  for (var i=1; i<17; i++)
  {
   var f = i.toString(16);
   color.push('0' + f + '0');
  }
  var fontSize = rand(9, 24);
  for (var i=1; i<17; i++)
  {
   var c = rand(33, 127);
   var c = String.fromCharCode(c);
   // html += '<span class="s' + i + '" style="color:#' + color[ci][i-1] + '; font-size:' + fontSize + 'px;">' + c + '</span>';
   html += '<span class="s' + i + '" style="color:#' + color[i-1] + '; font-size:' + fontSize + 'px; text-shadow:0px 0px 10px #' + color[i-1] + ';">' + c + '</span>';
  }
  html += '</div>';
  $('#divList').append(html);
 }
 function run()
 {
  var x = rand(0, 100);
  if (x < 100)
  {
   add();
  }
  $('#spanCount').html($('.divText').size());
  $('.divText').each(function(){
   var y = $(this).css('bottom');
   y = parseInt(y);
   y -= $(this).find('span').eq(0).height();
   $(this).css('bottom', '' + y + 'px');
   if (y + $(this).height() <= 0)
   {
    $(this).remove();
    return;
   }
  });
  window.setTimeout(run, 50);
 }
 run();

var write = function() {
  console.log($('.write').text());
}
// $('.write').on('input propertychange',function() {
//   console.log($('.write').val());
// })

var cpLock = true;

var text = '';

var appendText = function(val) {
  console.log(text);
  $('.input-value').text(text+val);
  text = $('.input-value').text();
  $('.write').val('');
}

$('.order-content').on('click',function() {
  $('.write').focus();
})

$('.order-head').on('click',function() {
  // console.log($('.order-box').css('margin-top'));
  var mt = $('.order-box').css('margin-top');
  mt = mt.substr(0,mt.length-2);
  console.log(mt);
  if (mt!=='0'){
    $('.order-box').css('margin','0 auto');
    $('.order-box').css('height','30px');
  } else {
    $('.order-box').css('margin','auto');
    $('.order-box').css('height','400px');
  }
})

function bindFn() {
  $('.write').off().on({
    //中文输入开始
    compositionstart: function () {
        cpLock = false;
    },
    //中文输入结束
    compositionend: function () {
      console.log($('.write').val());
        cpLock = true;
        appendText($('.write').val());
    },
    //input框中的值发生变化
    input: function () {
        if (cpLock){
          console.log($('.write').val());
          appendText($('.write').val());
            //这里处理中文输入结束的操作
        }
    }
  })
  $('.write').focus()
}

$(document).keydown(function(event){
  console.log("Key: "+event.keyCode);
  // 监听删除事件
  if (event.keyCode===8){
    console.log('删除');
    text = text.substr(0, text.length - 1);
    $('.input-value').text(text);
  }
  // 监听会车事件
  if (event.keyCode===13) {
    $('#model').empty();
    $('#model').append(`<div>你：${text}</div>`);
    // $('#model').text(text);
    $('#model').removeAttr('id');
    $('.order-scroller').append(`<div>${reduceFn(text)}</div>
          <section id="model">
           >>><div style="display: inline-block;" class="input-value"></div><input class="write" type="text">
         </section>`);
    bindFn();
    text = '';
  }
});

bindFn();


var reduceFn = function(text) {
  var call = '';

  switch (text) {
    case "姓名":call = 'Eric';
      break;
    case "性别":call = '男';
      break;
    case "年龄":call = '26';
      break;
    default:call = '你不是一个人';
      break;
  }
  return `<div>${call}</div>`;
}


