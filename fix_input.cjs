const fs = require('fs');
let code = fs.readFileSync('src/components/KPIManager.tsx', 'utf8');

code = code.replace(
  /const \[editDays, setEditDays\] = useState\(0\);/,
  "const [editDays, setEditDays] = useState<number | ''>(0);"
);

code = code.replace(
  /const \[editKpi, setEditKpi\] = useState\(0\);/,
  "const [editKpi, setEditKpi] = useState<number | ''>(0);"
);

code = code.replace(
  /setEditDays\(record\?\.daysWorked \|\| 0\);/,
  "setEditDays(record?.daysWorked ?? '');"
);

code = code.replace(
  /setEditKpi\(record\?\.kpiScore \|\| 0\);/,
  "setEditKpi(record?.kpiScore ?? '');"
);

code = code.replace(
  /onChange=\{e => setEditDays\(Number\(e\.target\.value\)\)\} /,
  "onChange={e => setEditDays(e.target.value === '' ? '' : Number(e.target.value))} "
);

code = code.replace(
  /onChange=\{e => setEditKpi\(Number\(e\.target\.value\)\)\} /,
  "onChange={e => setEditKpi(e.target.value === '' ? '' : Number(e.target.value))} "
);

code = code.replace(
  /daysWorked: editDays,/,
  "daysWorked: Number(editDays) || 0,"
);

code = code.replace(
  /kpiScore: editKpi,/,
  "kpiScore: Number(editKpi) || 0,"
);

fs.writeFileSync('src/components/KPIManager.tsx', code);
console.log('patched inputs');
