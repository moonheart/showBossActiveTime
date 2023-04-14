javascript: (function () {
  'use strict';

  function showBossActiveTime() {
    let isPageChange = false;

    function getLis() {
      /*要把在线的过滤掉，一来减少请求，二来请求的数据也不存在下面代码的class .boss-active-time，会报错'*/
      let links = Array.from(
        document.querySelectorAll('.job-list-box .job-card-left')
      ).filter((node) => {
        let online = node.querySelector('.boss-online-tag');
        if (online) {
          setText(node, '在线');
        }
        return !online;
      });
      return links;
    }

    function setText(node, statusTxt) {
      let pNode = document.createElement('p');
      pNode.innerHTML = statusTxt;
      console.log(statusTxt);
      pNode.style.cssText =
        'display:flex;padding:5px 10px;background:#e1f5e3;color:green;width:80%;border-radius:4px;margin-top:10px;';
      node.querySelector('.job-info').after(pNode);
      pNode.parentNode.style.height = 'auto';
      pNode.parentNode.style.paddingBottom = '0';
    }

    async function getListStatus() {
      alertBox('开始更新状态....,网站安全策略问题，更新会比较缓慢。');
      let links = getLis();
      for (let i = 0; i < links.length; i++) {
        if (isPageChange) {
          /*切换了分页， 要中断循环*/
          break;
        }
        let node = links[i];
        let link = node.href;
        await new Promise((resolve) => {
          setTimeout(async () => {
            /*做个延时处理，频繁请求会触发302重定向，最终导致拿不到html页面数据*/
            fetch(link)
              .then((res) => {
                if (res.redirected) {
                  throw new Error(res.url);
                }
                return res.text();
              })
              .then(async (data) => {
                const divNode = document.createElement('div');
                divNode.insertAdjacentHTML('afterbegin', data);
                const statusText = getStatusText(divNode);
                setText(node, statusText);
              })
              .catch(async (error) => {
                getStatusByIframe(error.message, i).then((res) => {
                  if (res === '') {
                    res = '未知状态';
                  }
                  setText(node, res);
                });
              });
            resolve();
          }, 1000);
        });
        if (i === links.length - 1) {
          alertBox('更新完成');
        }
      }
    }

    async function getStatusByIframe(link, id) {
      let iframe = document.createElement('iframe');
      iframe.src = link;
      iframe.id = 'tempIframe' + id;
      iframe.style.cssText = 'width:0;height:0;';
      document.body.appendChild(iframe);

      return await new Promise((resolve) => {
        let tempIframe = document.querySelector('#tempIframe' + id);
        tempIframe.onload = function () {
          setTimeout(() => {
            if (tempIframe.contentWindow?.document) {
              const statusText = getStatusText(
                tempIframe.contentWindow.document
              );
              resolve(statusText);
              console.log('用iframe获取', statusText);
              setTimeout(() => {
                document.body.removeChild(tempIframe);
              }, 500);
            }
          }, 5000);
        };
      });
    }
    function pageBtnBindClick() {
      let pages = document.querySelectorAll('.options-pages a');
      /*因为分页每次点击都会重新渲染，所以需要点击后用定时器重新运行方法"*/
      for (let i = 0; i < pages.length; i++) {
        pages[i].addEventListener('click', function () {
          isPageChange = true;
          setTimeout(function () {
            showBossActiveTime();
          }, 1000);
        });
      }
    }
    function alertBox(msg) {
      var div = document.createElement('div');
      div.style.cssText =
        'position: fixed; top: 20%; left: 50%; transform: translate(-50%, -50%); background-color: rgb(0 190 189); border-radius: 5px; color: #fff; z-index: 9999; padding: 20px 100px; font-size: 20px; box-shadow: 0px 0px 10px rgba(0,0,0,.2);';
      div.innerHTML = msg;
      document.body.appendChild(div);
      setTimeout(function () {
        document.body.removeChild(div);
      }, 2000);
    }
    function getStatusText(doc) {
      const timeNode = doc.querySelector('.boss-active-time');
      if (timeNode) {
        console.log('用接口获取', timeNode.textContent);
        return timeNode.textContent;
      } else {
        /*没有获取到状态，但页面是已经加载到的了*/ 
        const isHunter = ['.certification-tags', '.boss-info-attr'].filter(
          (name) => {
            const node = doc.querySelector(name);
            return /猎头|人力|经纪/.test(node.textContent);
          }
        );
        const status = isHunter
          ? '猎头，没有活跃状态'
          : '获取到数据了，但不知道是什么数据';
        return status;
      }
    }
    function init() {
      pageBtnBindClick();
      getListStatus();
    }

    init();
  }
  showBossActiveTime();
})();
