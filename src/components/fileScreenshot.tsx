import { useState } from "react";
import { useCallback, useEffect } from "react";

const FileScreenshot: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const handleChange = useCallback((event: any) => {
    const fileData = event.target.files[0];
    console.log(`fileData===>`, fileData);
    const objectURL = window.URL.createObjectURL(fileData); // 来生成图片的一张缩略预览图
    console.log(`objectURL===>`, objectURL);
    setImageSrc(objectURL);
    // 当不再需要这些 URL 对象时，每个对象必须通过调用 URL.revokeObjectURL() 方法来释放。
  }, []);
  return (
    <div>
      <label htmlFor="avatar">Choose a profile picture:</label>
      <input onChange={handleChange} type="file" id="avatar" name="avatar" />
      <img src={imageSrc} alt="" />
    </div>
  );
};

export default FileScreenshot;
