const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

//Database(MySql) configulationss
const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "123456789",
        database: "db_md_purit"
    }
)

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const profileName = "image_";
    const ext = path.extname(file.originalname);
    cb(null, profileName + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

db.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

//INTO
app.post('/api/addpd',upload.single('Image') ,function(req, res){
    const {datacomName, datacomModel, datacomSerial, datacomQuantity, datacomPrice, datacomCPU, datacomRam, datacomHDD} = req.body
    if(!datacomName || !datacomModel || !datacomSerial || !datacomQuantity || !datacomPrice || !datacomCPU || !datacomRam || !datacomHDD){
        return res.status(400).send({"message":"กรุณากรอกข้อมูลให้ครบถ้วน", "status":false});
    }

    if (!req.file) {
        return res.json({ "message": "ต้องมีภาพประกอบ", "status": false });
    }

    const ImageURL = `/uploads/${req.file.filename}`;

    const sql = "INSERT INTO datacom (datacomName, datacomModel, datacomSerial, datacomQuantity, datacomPrice, datacomCPU, datacomRam, datacomHDD,datacomIMG) values (?,?,?,?,?,?,?,?,?)"
    db.query(sql, [datacomName, datacomModel, datacomSerial, datacomQuantity, datacomPrice, datacomCPU, datacomRam, datacomHDD,ImageURL], function(err, result){
        if(err) {
            console.error('Errorvinserting data into the database;',err);
            res.status(100).send({"message":"เปิดข้อผิดพลาดในการบันทึกลงระบบ", "status":false});
            return;
        }        
        res.send({ 'message' : 'บันทึกสำเร็จ', 'status' : true});
    })    
} )

// เส้นทางใหม่เพื่อดึงข้อมูลโดยใช้ datacomID
app.get('/api/getpd/:id', function(req, res){
    const datacomID = req.params.id;

    // ตรวจสอบว่า datacomID มีค่าหรือไม่
    if (!datacomID) {
        return res.status(400).send({ "message": "กรุณาระบุ datacomID", "status": false });
    }

    const sql = "SELECT * FROM datacom WHERE datacomID = ?";
    db.query(sql, [datacomID], function(err, results) {
        if (err) {
            console.error('Error fetching data from the database:', err);
            return res.status(500).send({ "message": "เกิดข้อผิดพลาดในการดึงข้อมูล", "status": false });
        }
        if (results.length === 0) {
            return res.status(404).send({ "message": "ไม่พบข้อมูลที่ตรงกับ datacomID ที่ระบุ", "status": false });
        }
        results[0]["message"] = 'ดึงข้อมูลสำเร็จ'
        results[0]["status"] = true

        res.send(results[0]);
    });
});


//Web server
app.listen(port, function() {
    console.log(`Example app listening on port ${port}`)
})