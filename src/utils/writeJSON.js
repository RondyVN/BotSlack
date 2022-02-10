import fs from "fs";

export const writeJson = (nameFile, obj) => {
    fs.writeFile(nameFile, JSON.stringify(obj), (err) => {
        if (err) console.log('Error')
    })
}