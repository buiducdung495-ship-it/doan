const fs = require('fs');

let cm = fs.readFileSync('src/components/ContractManager.tsx', 'utf8');

const replacement = `  useEffect(() => {
    const saved = localStorage.getItem('sio_contracts_v2');
    if (saved) { try { setContracts(JSON.parse(saved)); } catch(e) { console.error(e); } } else { setContracts([]); }
  }, [currentUser.id]);

  const saveContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    localStorage.setItem('sio_contracts_v2', JSON.stringify(newContracts));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContract) {
      const updated = contracts.map(c => c.id === selectedContract.id ? { ...c, ...formData } as Contract : c);
      saveContracts(updated);
    } else {
      const newContract: Contract = {
        id: uuidv4(),
        code: formData.code || \`HD-\${new Date().getFullYear()}-\${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}\`,
        partnerName: formData.partnerName || '',
        value: Number(formData.value) || 0,
        status: formData.status || 'draft',
        salespersonId: currentUser.id,
        createdAt: new Date().toISOString()
      };
      saveContracts([newContract, ...contracts]);
    }
    setIsAdding(false);
    setSelectedContract(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {`;

cm = cm.replace(/  useEffect\(\(\) => \{\s*const saved = localStorage\.getItem\('sio_contracts_v2'\);\s*if \(saved\) \{ try \{ setContracts\(JSON\.parse\(saved\)\); \} catch\(e\) \{ console\.error\(e\); \} \} else \{ setContracts\(\[\]\); \};\s*const handleDelete = \(id: string\) => \{/, replacement);

fs.writeFileSync('src/components/ContractManager.tsx', cm);
console.log('Fixed');
