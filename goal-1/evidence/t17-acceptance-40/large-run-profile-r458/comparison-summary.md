# 459 fixed-input comparison

| phase | baseline | candidate 1 | candidate 2 |
|---|---:|---:|---:|
| codec import | 69,011.52 ms | 27,943.43 ms | 22,204.78 ms |
| codec export | 61,857.79 ms | 38,752.56 ms | 32,041.09 ms |
| canonical whole run | 2,589.74 ms | 3,056.71 ms | 2,520.98 ms |
| total | 135,487.37 ms | 71,875.19 ms | 58,206.68 ms |

All runs used the same saved revision 545 and required whole-wire equality. This is bounded diagnostic evidence, not a formal performance pass.
