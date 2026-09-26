import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_private_client_sequence_matches_registered_clients_and_schema():
    source = json.loads((ROOT / "private/clientes/.sequence.json").read_text())
    schema = json.loads(
        (ROOT / "schemas/private/cliente-sequence.schema.json").read_text()
    )

    registered_ids = [
        int(path.name)
        for path in (ROOT / "private/clientes").iterdir()
        if path.is_dir() and path.name.isdigit()
    ]
    assert source == {"last_id": max(registered_ids, default=0)}
    assert schema["required"] == ["last_id"]
    assert schema["properties"]["last_id"] == {
        "type": "integer",
        "minimum": 0,
        "maximum": 99999,
    }
    assert schema["additionalProperties"] is False
