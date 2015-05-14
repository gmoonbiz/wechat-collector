var mysql = require('mysql');
var conn = mysql.createConnection({
	host: 'localhost',
    user: 'root',
    password: '',
    database: 'wechat_pick',
    port: 3306
});

conn.connect();

var insertSQL = 'insert into wechat_article(title) values("abc"),("你好")';
var selectSQL = 'select * from wechat_article limit 10';
var deleteSQL = 'delete from wechat_article';
var updateSQL = 'update wechat_article set name="abc changed"  where name="abc"';

//delete
conn.query(deleteSQL, function (err0, res0) {
    if (err0) console.log(err0);
    console.log("DELETE Return ==> ");
    console.log(res0);

    //insert
    conn.query(insertSQL, function (err1, res1) {
        if (err1) console.log(err1);
        console.log("INSERT Return ==> ");
        console.log(res1);

        //query
        conn.query(selectSQL, function (err2, rows) {
            if (err2) console.log(err2);

            console.log("SELECT ==> ");
            for (var i in rows) {
                console.log(rows[i]);
            }

            //update
            conn.query(updateSQL, function (err3, res3) {
                if (err3) console.log(err3);
                console.log("UPDATE Return ==> ");
                console.log(res3);

                //query
                conn.query(selectSQL, function (err4, rows2) {
                    if (err4) console.log(err4);

                    console.log("SELECT ==> ");
                    for (var i in rows2) {
                        console.log(rows2[i]);
                    }
                });
            });
        });
    });
});

//conn.end();