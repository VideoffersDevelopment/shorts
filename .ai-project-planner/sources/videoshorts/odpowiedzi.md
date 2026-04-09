Pytania doprecyzowujące
Podzieliłem je na kategorie. Proszę o odpowiedzi na każde — to wpłynie na architekturę i kolejność prac.

A) Scope MVP — Co wdrażamy TERAZ, a co PÓŹNIEJ?
A1. Wchodzi do MVP ale tylko wersja standard - później dodamy kolejne

A2. TAK

A3. TAK

A4. NIE wchdozą

A5. TAK

A6. NIE, musi byc admin ui


B) Niespójności w dokumencie
B1. 500 - jesli zauwazysz takie roznice to wynika to z tego zse mnozylismy ilości kredytów x10 aby było to np. 1000 za opublikowanie a nie 100 kredytów (ze względów psychologi kupujacego)

B2. 100 puktów publikacja - patrz uwagę powyzej ( nie zostało to w dok. poprawione z logiką zwiekszenia ilości kredytów kupowanych i wydawanych )

B3. Patrz wyżej 


C) Logika biznesowa — decyzje architektoniczne
C1. Przy rejestracji konta firmowego (rola USER → COMPANY) 

C2. NIC NIE ROBIMY, nie ma uzytwkoników poza testowymi 

C3.OK

C4. usuwamy stare - to jest faza wdrozenia 

C5. USUWAMY


D) Techniczne — priorytety i podejście
D1. Vertical slices

D2. (TDD)

D3. Usuwamy w tej samej migracji (breaking change, czysty start)