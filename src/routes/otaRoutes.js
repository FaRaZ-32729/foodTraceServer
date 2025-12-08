// const express = require("express");
// const uploadFile = require("../utils/uploadFile");
// const { uploadOTA, getAllOTAVersions, getOTAVersionById, deleteOTAVersion } = require("../controllers/otaController");
// const router = express.Router();

// router.post("/upload", uploadFile.single("otaFile"), uploadOTA);

// router.get("/get-all", getAllOTAVersions);
// router.get("/get-single/:id", getOTAVersionById);
// router.delete("/delete/:id", deleteOTAVersion);

// module.exports = router;


const express = require("express");
const router = express.Router();
const uploadFile = require("../utils/uploadFile");
const { uploadOTA, getAllOTAFiles, deleteOTAFile, startOTA } = require("../controllers/otaController");


router.post("/upload", uploadFile.single("otaFile"), uploadOTA);
router.get("/all", getAllOTAFiles);
router.delete("/delete/:id", deleteOTAFile);
router.post("/start", startOTA)


module.exports = router;
