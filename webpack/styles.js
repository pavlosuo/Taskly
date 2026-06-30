import path from "path";
import fs from "fs";

const styles = () => {
  const scssDirectory = "apps/web/src/scss";
  const outputFile = "apps/web/src/scss/style.scss";

  function getScssFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getScssFiles(filePath, fileList);
      } else if (
        file.endsWith(".scss") &&
        file !== "style.scss" &&
        file !== "fonts.scss"
      ) {
        fileList.push(filePath.replace(/\\/g, "/"));
      }
    });
    return fileList;
  }

  const scssFiles = getScssFiles(scssDirectory);
  const mixinsFileIndex = scssFiles.findIndex((file) =>
    file.includes("mixins"),
  );
  if (mixinsFileIndex !== -1) {
    const [mixinsFile] = scssFiles.splice(mixinsFileIndex, 1);
    scssFiles.unshift(mixinsFile);
  }
  const importStatements = scssFiles
    .map((file) => `@import "${file.replace(scssDirectory, "")}";`)
    .join("\n");
  fs.writeFileSync(outputFile, importStatements);
};

styles();
