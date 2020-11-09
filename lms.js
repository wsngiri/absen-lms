const puppeteer = require('puppeteer');

(async () => {
    let date = new Date();
    let tanggal = date.getDate();
    let bulan = date.getMonth();
    let tahun = date.getFullYear();
    const username = 'fill with username';
    const password = 'fill with password';
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    //login
    await login(page, username, password);
    //ambil link semua matkul
    const links = await getLinkAllMatkul(page);

    for (let link of links) {
        try {
            await gotoPerMatkul(page, link)
            await page.waitForSelector('.generaltable.attwidth.boxaligncenter', {
                timeout: 60000 * 3
            });
            const namaMatkul = await page.$eval('#page-header .card h1', h1 => h1.innerText)
            const absen = await page.$$eval('.generaltable.attwidth.boxaligncenter tbody tr .statuscol.cell.c2.lastcol a', tbl => tbl.map(t => t.click()));
            if (absen === undefined || absen.length == 0) {
                console.log(`Matkul ${namaMatkul} hari ini tidak ada absen`);
                continue;
            }

            await page.waitForSelector('#id_session #fgroup_id_statusarray label input');
            await page.$$eval('#id_session #fgroup_id_statusarray label span', span => span.find(text => text.textContent === 'Present').click());
            await page.$eval('#id_submitbutton', btn => btn.click());
            await page.waitForSelector('#page-content', {
                timeout: 60000 * 3,
            });

            await page.screenshot({
                path: `absensi/${tanggal}_${bulan+1}_${tahun}_${namaMatkul}.png`,
                type: 'png',
                fullPage: true,
            });
            console.log(`absen matkul ${namaMatkul} sukses`);
        } catch (error) {
            if (error = 'Error: failed to find element matching selector ".section.img-text .activity.attendance.modtype_attendance .activityinstance a"') {
                console.log(`Matkul ini tidak ada absensinya`);
            }
        }
    }
    await browser.close();
})();


async function gotoPerMatkul(page, url) {
    await page.goto(url, {
        timeout: 60000 * 3,
    });
    // pergi ke halaman absen
    const courses = await page.$eval('.section.img-text .activity.attendance.modtype_attendance .activityinstance a', a => a.click());
    return courses;

}


async function getLinkAllMatkul(page) {
    await page.waitForSelector('#nav-drawer .list-group ul li a', {
        timeout: 60000 * 3
    });
    const linkAllMatkul = await page.$$eval('#nav-drawer .list-group ul li a', li => li.map(a => a.href))
    const links = linkAllMatkul.slice(3)
    console.log(links);
    return links;
}

async function login(page, username, password) {
    await page.goto("https://lmsc19.polinema.ac.id/login/index.php", {
        waitUntil: "load",
        timeout: 60000 * 3,
    });
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('#loginbtn', {
        delay: 1000
    });

}