import { useState } from "react";
import { useCallback, useEffect } from "react";
import JSZip from "jszip";
const zip = new JSZip();
const { XMLParser, XMLBuilder } = require("fast-xml-parser");
let reader = new FileReader();
const options = {
  ignoreAttributes: false,
  attributeNamePrefix : "@_"
};

const stringifyByChunk = (array: any, type: string, chunk: number = 65535) => {
  var result = [],
    k = 0,
    len = array.length;
  // shortcut
  if (len <= chunk) {
    return String.fromCharCode.apply(null, array);
  }
  while (k < len) {
    if (type === "array" || type === "nodebuffer") {
      result.push(
        String.fromCharCode.apply(
          null,
          array.slice(k, Math.min(k + chunk, len))
        )
      );
    } else {
      result.push(
        String.fromCharCode.apply(
          null,
          array.subarray(k, Math.min(k + chunk, len))
        )
      );
    }
    k += chunk;
  }
  return result.join("");
};
function downloadFile(content: any, filename: string) {
  let a = document.createElement("a");
  a.href = content;
  a.download = filename;
  a.click();
}
// function Uint8ArrayToString(fileData: any) {
//   const uint8Array = new Uint8Array(fileData);
//   var decoder = new TextDecoder("utf-8");
//   var uint8_msg = new Uint8Array(uint8Array);
//   return decoder.decode(uint8_msg);
// }

function stringToUint8Array(str: string) {
  return str;
  // var arr = [];
  // for (var i = 0, j = str.length; i < j; ++i) {
  //   arr.push(str.charCodeAt(i));
  // }

  // var tmpUint8Array = new Uint8Array(arr);
  // return tmpUint8Array;
}

const FileZipReader: React.FC = () => {
  // addJavaScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.js");
  // const [imageSrc, setImageSrc] = useState<string>("");
  const handleChange = useCallback(async (event: any) => {
    const fileData = event.target.files[0];
    console.log(`fileData===>1`, fileData, fileData.raw);
    // const objectURL = window.URL.createObjectURL(fileData); // 来生成图片的一张缩略预览图
    // console.log(`objectURL===>`, objectURL);
    // setImageSrc(objectURL);
    // 当不再需要这些 URL 对象时，每个对象必须通过调用 URL.revokeObjectURL() 方法来释放。
    const res = await zip.loadAsync(fileData);
    const slidePovit = `ppt/slides/slide`;
    const relsPovit = `ppt/slides/_rels/slide`;
    for (let key in res.files) {
      // 1 修改 ppt/slides/
      if (key.startsWith(slidePovit) && key !== `${slidePovit}1.xml`) {
        console.log("命中的key", key);
        zip.remove(key);
      }
      // 2 修改 ppt/slides/_rels/
      if (key.startsWith(relsPovit) && key !== `${relsPovit}1.xml.rels`) {
        console.log("命中的relsPovit", key);
        zip.remove(key);
      }

      // 3 docProps/app.xml修改页数
      if (key === 'docProps/app.xml') {
        const file = await zip.file(key); // 获取特定文件对象
        const parser = new XMLParser(options);
        if (!file) {
          continue;
        }
        const fileContent = await file.async("text"); // 异步读取文件内容（文本格式）
        let jObj = await parser.parse(fileContent);
        jObj['Properties']['Slides'] = 1;
        // 将 JSON 转化成 XML 字符串
        const builder = new XMLBuilder(options);
        const xmlContent = await builder.build(jObj);
        zip.file(key, stringToUint8Array(xmlContent)); // 更新文件内容
      }

      // 4 修改 [Content_Types].xml 的依赖关系
      if (key === "[Content_Types].xml") {
        // //@ts-ignore
        // const a = Uint8ArrayToString(res.files[key]._data.compressedContent);
        // console.log("a", a);
        const file = await zip.file(key); // 获取特定文件对象
        //@ts-ignore
        console.log('res--->', res, res.files[key]._data.compressedContent);
        if (file) {
          const fileContent = await file.async("text"); // 异步读取文件内容（文本格式）
         
          const parser = new XMLParser(options);
          let jObj = await parser.parse(fileContent);
          let override = jObj['Types']['Override'];
          console.log('[Content_Types].xml--->', jObj);
          override = override.filter((item: any) => {
            const key = item['@_PartName'];
            return !(key.startsWith('/ppt/slides/slide') && key !== `${slidePovit}1.xml`);
          });
          jObj['Types']['Override'] = override;

          // 将 JSON 转化成 XML 字符串
          const builder = new XMLBuilder(options);
          const xmlContent = await builder.build(jObj);
          console.log(jObj, typeof xmlContent);
          zip.file(key, stringToUint8Array(xmlContent)); // 更新文件内容
        }
      }

      // 5 ppt/presentation.xml 修改 p:sldIdLst下的 p:sldId
      if (key === 'ppt/presentation.xml') {
        const file = await zip.file(key); // 获取特定文件对象
        const parser = new XMLParser(options);
        if (!file) {
          continue;
        }
        const fileContent = await file.async("text"); // 异步读取文件内容（文本格式）
        let jObj = await parser.parse(fileContent);
        console.log('jObj', jObj);
        jObj['p:presentation']['p:sldIdLst']['p:sldId'] = jObj['p:presentation']['p:sldIdLst']['p:sldId'][0];
         // 将 JSON 转化成 XML 字符串
         const builder = new XMLBuilder(options);
         const xmlContent = await builder.build(jObj);
         zip.file(key, stringToUint8Array(xmlContent)); // 更新文件内容
      }

      // ppt/_rels/presentation.xml.rels 修改 Relationships.Relationship 数组
      if (key === 'ppt/_rels/presentation.xml.rels') {
        const file = await zip.file(key); // 获取特定文件对象
        const parser = new XMLParser(options);
        if (!file) {
          continue;
        }
        const fileContent = await file.async("text"); // 异步读取文件内容（文本格式）
        let jObj = await parser.parse(fileContent);
        console.log('ppt/_rels/presentation.xml.rels - jObj', jObj);
        jObj['Relationships']['Relationship'] = jObj['Relationships']['Relationship'].filter((item: any) => {
          const key = item['@_Target'];
          return !(key.startsWith('slides/') && key !== `slides/slide1.xml`)
        });
        console.log('ppt/_rels/presentation.xml.rels', jObj);
        const builder = new XMLBuilder(options);
        const xmlContent = await builder.build(jObj);
        zip.file(key, stringToUint8Array(xmlContent)); // 更新文件内容
      }
    }

    zip.generateAsync({ type: "blob" }).then(function (content: any) {
      // see FileSaver.js
      let objectUrl = URL.createObjectURL(content); //生成一个url
      downloadFile(objectUrl, "example.ppt");
    });
    console.log(`JSZip.loadAsync(file.raw)1`, res);
  }, []);
  return (
    <div>
      <label htmlFor="avatar">Choose a profile file2:</label>
      <input onChange={handleChange} type="file" id="avatar" name="avatar" />
      {/* <img src={imageSrc} alt="" /> */}
    </div>
  );
};

export default FileZipReader;

// JSZip.loadAsync(file.raw).then(function (zip) {
//   for (let key in zip.files) {
//     // 循环遍历文件夹下的文件
//     if (!zip.files[key].dir) {
//       if (zip.files[key].name == "config.json") {
//         var base = zip.file(zip.files[key].name).async("string");
//         // uint8array base64 string
//         // 可以选择想要的类型输出，比如解图用base64，文本string等
//         base.then((res) => {
//           // res 是文件里的内容，下面可以对内容进行操作
//           let versionObj = (res && JSON.parse(res)) || {};
//         });
//       }
//     }
//   }
// });
