module.exports.searchSnapshots = async (req, res) => {
  let startSearchDate;
  let endSearchDate;
  if (req.body.dateSearchFromForm) {
    startSearchDate = new Date(req.body.dateSearchFromForm); //custom search
    endSearchDate = new Date(startSearchDate.getTime() + 1000 * 60 * 60 * 24);
  } else {
    endSearchDate = new Date(); //now
    startSearchDate = new Date(endSearchDate.getTime() - 1000 * 60 * 60 * 24);
  }
  const sql = `SELECT * FROM ftps WHERE file_time >= "${startSearchDate.toISOString()}" AND file_time < "${endSearchDate.toISOString()}" ORDER BY file_time DESC`;
  try {
    await req.app.locals.pool.query(sql).then((data) => {
      let results = { jpgs: [], mkvs: [] };
      data[0].forEach((e) => {
        if (e.file_path.includes("jpg")) {
          const newJpg = { path: e.file_path, fileTime: e.file_time, fileType: e.file_type };
          results.jpgs.push(newJpg);
        } else {
          const newMkv = { path: e.file_path, fileTime: e.file_time, fileType: e.file_type };
          results.mkvs.push(newMkv);
        }
      });
      if (req.body.dateSearchFromForm) {
        results.date = startSearchDate.toDateString();
      }
      res.render("carousel", { results });
    });
  } catch (error) {
    console.error(error);
  }
};
