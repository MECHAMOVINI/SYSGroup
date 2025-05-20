const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Execute o comando tsc para obter os erros
try {
  console.log('Analisando erros de importações não utilizadas...');
  
  // Função para percorrer diretórios recursivamente
  function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
  
    files.forEach(file => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);
  
      if (stats.isDirectory()) {
        filelist = walkSync(filepath, filelist);
      } else if (stats.isFile() && (filepath.endsWith('.tsx') || filepath.endsWith('.ts'))) {
        const content = fs.readFileSync(filepath, 'utf-8');
        const lines = content.split('\n');
        
        // Procurar por importações
        const importLines = [];
        let inImportBlock = false;
        let startLine = -1;
        
        lines.forEach((line, index) => {
          if (line.includes('import ') && !inImportBlock) {
            inImportBlock = true;
            importLines.push({ line: index + 1, text: line.trim() });
            startLine = index;
          } else if (inImportBlock) {
            if (line.includes('}') || (line.trim() && !line.includes('import ') && !line.includes(','))) {
              inImportBlock = false;
            } else {
              importLines.push({ line: index + 1, text: line.trim() });
            }
          }
        });
        
        // Se encontrou importações, verifica se há variáveis não usadas
        if (importLines.length > 0) {
          // Procurar por importações em blocos ou individuais
          const imports = [];
          
          importLines.forEach(importLine => {
            const matches = importLine.text.match(/\{([^}]+)\}/);
            if (matches) {
              const items = matches[1].split(',').map(item => item.trim().split(' as ')[0].trim());
              items.forEach(item => {
                if (item) {
                  imports.push({ name: item, line: importLine.line });
                }
              });
            } else if (importLine.text.includes('import') && !importLine.text.includes('*')) {
              const match = importLine.text.match(/import\s+(\w+)/);
              if (match) {
                imports.push({ name: match[1], line: importLine.line });
              }
            }
          });

          // Verificar quais importações são usadas no arquivo
          const fileContentWithoutImports = content.substring(content.indexOf(importLines[importLines.length - 1].text) + importLines[importLines.length - 1].text.length);
          
          const unusedImports = imports.filter(imp => {
            // Ignorar alguns casos especiais
            if (imp.name === 'React' || imp.name === 'react' || imp.name === 'css' || imp.name === 'useState' || imp.name === 'useEffect') {
              return false;
            }
            
            // Verificar se a importação é usada no conteúdo do arquivo
            const regex = new RegExp(`\\b${imp.name}\\b`);
            return !regex.test(fileContentWithoutImports);
          });
          
          if (unusedImports.length > 0) {
            console.log(`\nArquivo: ${filepath}`);
            unusedImports.forEach(imp => {
              console.log(`  Linha ${imp.line}: '${imp.name}' é declarado mas nunca utilizado`);
            });
          }
        }
      }
    });
  
    return filelist;
  }

  // Iniciar a busca a partir do diretório src
  walkSync(path.join(__dirname, 'src'));
  
} catch (error) {
  console.error('Erro ao executar o script:', error);
} 