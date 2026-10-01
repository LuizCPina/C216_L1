import pytest


def soma(a,b):
    return a + b

def test_soma():
    assert soma(2, 3) == 5

def eh_par(numero):
    return numero % 2 == 0

def test_eh_par():
    assert eh_par(4) == True

def dividir(a, b):
    if b == 0:
        raise ValueError("divisao por zero")
    return a / b

def test_dividisao_por_zero():
    with pytest.raises(ValueError):
        dividir(10, 0)

@pytest.mark.parametrize(
    "numero, esperado",
    [
        (2, True),
        (3, False),
        (10, True),
        (11, False),
    ],
) 
def test_eh_par_parametrizado(numero, esperado):
    assert (numero % 2 == 0) == esperado

@pytest.fixture
def usuario():
    return {
        "nome": "Maria",
        "email": "maria@example.com",
    }

def test_usuario(usuario):
    assert usuario["nome"] == "Maria"