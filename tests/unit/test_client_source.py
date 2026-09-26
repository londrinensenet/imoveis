import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_private_client_source_is_initialized_with_official_empty_schema():
    source = json.loads((ROOT / "private/clientes/.sequence.json").read_text())
    schema = json.loads(
        (ROOT / "schemas/private/cliente-sequence.schema.json").read_text()
    )

    assert source == {"last_id": 0}
    assert schema["required"] == ["last_id"]
    assert schema["properties"]["last_id"] == {
        "type": "integer",
        "minimum": 0,
        "maximum": 99999,
    }
    assert schema["additionalProperties"] is False
