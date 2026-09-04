"""Copia exclusivamente a raiz publicável para o diretório de saída do Pages."""
from pathlib import Path
import shutil
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import scripts.validate_public  # valida ao importar
ROOT=Path(__file__).resolve().parents[1]
def build(output=ROOT/'dist'):
    shutil.rmtree(output,ignore_errors=True)
    shutil.copytree(ROOT/'public',output)
    forbidden={'private','.github','importadores','src','worker-admin'}
    assert not any(part in forbidden for path in output.rglob('*') for part in path.relative_to(output).parts)
    return output
if __name__=='__main__': build()
