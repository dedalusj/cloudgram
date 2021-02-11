diagram "bidirectional" {
  generic.component a;
  generic.component b;
  generic.component c;

  group g1 {
      generic.component g11;
      generic.component g12;
  }

  group g2 {
      generic.component g21;
      generic.component g22;
  }

  a -> b <-> c;
  b => g1;
  c <=> g2;
}
