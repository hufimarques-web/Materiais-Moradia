// Paths are in the approved panorama's native 1774 × 887 coordinates.
// Holes keep appliances, furniture, glass, sanitaryware and decorations intact.
export const rooms = {
  kitchen: {
    image:'assets/kitchen.webp',variants:['assets/kitchen-areia.webp','assets/kitchen-grafite.webp'], label:'Cozinha', short:'Cozinha', location:'R/C',
    normal:{yaw:-.3,pitch:-.12,fov:120},
    // High-resolution tall cabinetry stays registered while the viewer rotates.
    cabinetDetail:{yaw:-.85,pitch:0,tangent:Math.tan(50*Math.PI/180)/1.45,aspect:1,width:1600,height:1600,feather:6,
      images:{w1000:'assets/kitchen-cabinets-luz.webp',u702:'assets/kitchen-cabinets-areia.webp',u963:'assets/kitchen-cabinets-grafite.webp'},
      path:'M330 234 L1340 390 L1340 1160 L1270 1210 L1200 1250 L1170 1390 L950 1410 L890 1250 L650 1250 L500 1280 L500 1420 L330 1432 Z M760 210 L1040 160 L1040 0 L1310 0 L1370 170 L1520 170 L1540 410 L1380 430 L1200 510 L1100 540 L970 590 L800 570 L760 410 Z'},
    // Registered slab and counter detail keeps the repaired accessories fixed.
    slabDetail:{yaw:.15,pitch:-.04,tangent:Math.tan(33*Math.PI/180),aspect:16/9,width:1600,height:900,
      images:{'gaia-cinza-wall|negro-angola':'assets/kitchen-fitted-cinza.webp','gaia-creme-wall|negro-angola':'assets/kitchen-fitted-creme.webp','borba-white-wall|negro-angola':'assets/kitchen-fitted-branco.webp','gaia-cinza-wall|pedras-salgadas':'assets/kitchen-fitted-granito.webp','gaia-creme-wall|pedras-salgadas':'assets/kitchen-fitted-creme-granito.webp','borba-white-wall|pedras-salgadas':'assets/kitchen-fitted-branco-granito.webp'},
      // Match the slab's four outer corners to the approved panorama.
      registration:{source:[[132,337],[1512,317],[1515,780],[132,663]],target:[[132,340],[1508,317],[1511,775],[133,671]]},
      path:'M132 337 Q800 350 1512 317 L1500 680 L1515 755 L1515 780 Q800 701 132 663 L130 634 Z'},
    // Registered downward view repairs the generated panorama's pinched pole.
    floorDetail:{yaw:0,pitch:-Math.PI/2,tangent:Math.tan(Math.PI/3)/1.45,aspect:1,feather:.09,images:{'gaia-cinza-floor':'assets/kitchen-floor-cinza.webp','gaia-creme-floor':'assets/kitchen-floor-creme.webp','gaia-antracite-floor':'assets/kitchen-floor-antracite.webp'}},
    handleDetail:{yaw:.15,pitch:-.275,tangent:Math.tan(31*Math.PI/180),aspect:2,width:1774,height:887,
      images:{w1000:'assets/kitchen-handles-luz.webp',u702:'assets/kitchen-handles-areia.webp',u963:'assets/kitchen-handles-grafite.webp'},
      // Red: replace the old blurred silhouette and its immediate background.
      // Green: finish tint, restricted to the new metal body, not the cabinet.
      surrounds:['M194 389 L338 399 L338 429 L194 419 Z','M503 404 L662 416 L664 455 L503 443 Z','M853 434 L1038 449 L1040 491 L853 476 Z','M1282 476 L1507 502 L1507 549 L1282 522 Z'],
      metal:['M206 394 L318 402 L325 400 L328 408 L319 411 L206 402 Z','M519 420 L641 429 L647 427 L649 435 L642 439 L519 429 Z','M870 451 L1015 462 L1021 460 L1023 471 L1017 474 L870 459 Z','M1301 495 L1484 515 L1488 512 L1490 524 L1487 529 L1300 505 Z']},
    groups:['fronts','countertop','backsplash','handles','floor','wood'],
    types:[1,2,3,4,5,6], light:[.84,.16,.77,.4,.66,.46], defaults:{fronts:'w1000',countertop:'negro-angola',backsplash:'borba-white-wall',handles:'handle-black',floor:'gaia-cinza-floor',wood:'h1367'},
    focus:{fronts:{yaw:-.45,pitch:-.12,fov:88},countertop:{yaw:.26,pitch:-.20,fov:76},backsplash:{yaw:.25,pitch:-.08,fov:78},handles:{yaw:.28,pitch:-.31,fov:73},floor:{yaw:.3,pitch:-.66,fov:75},wood:{yaw:.22,pitch:.22,fov:60}},
    points:[{id:'fronts',x:605,y:488},{id:'countertop',x:1050,y:508},{id:'backsplash',x:960,y:453},{id:'handles',x:944,y:527},{id:'floor',x:1052,y:726}],
    masks:[
      {id:5,path:'M522 595 L790 571 L1075 611 L1114 653 Q1235 794 1585 782 L1774 717 L1774 887 L214 887 Q385 745 522 595 Z',holes:['M560 563 L641 541 Q679 533 721 537 L885 552 L884 579 L562 671 Z','M579 560 Q580 522 626 527 L647 532 L649 544 Z','M670 684 Q674 660 718 657 L789 662 Q822 625 848 623 Q875 616 882 632 L867 718 Q848 762 802 761 L739 759 Q678 754 668 713 Z','M846 616 Q864 589 939 574 Q969 564 965 593 L947 652 Q939 677 915 680 L879 692 Z','M620 663 L643 658 L644 756 L631 771 L621 767 Z','M607 666 L621 667 L617 718 L606 718 Z','M676 741 L688 751 L673 783 L662 780 Z','M749 762 L768 760 L763 848 L750 848 Z','M849 739 L860 737 L876 795 L864 799 Z','M905 680 L915 679 L922 756 L912 757 Z','M942 654 L950 652 L960 707 L951 712 Z']},
      {id:1,path:'M522 309 Q648 300 790 342 L790 544 L746 549 L665 537 L610 553 L561 561 L560 595 L520 590 Z M792 502 L1074 519 L1073 602 L968 600 Q966 570 941 571 L874 591 L876 553 L791 532 Z',holes:['M678 381 L738 384 L738 483 L680 480 Z','M537 391 L589 391 L589 471 L538 471 Z']},
      {id:3,path:'M792 432 L1068 431 L1074 499 L791 491 Z',holes:['M794 475 L802 454 L814 450 L821 459 L828 456 L839 467 L833 483 L848 486 L847 494 L803 492 Z','M876 462 L902 461 L903 494 L877 492 Z','M844 481 L870 479 L874 493 L845 493 Z','M1005 463 L1014 462 L1015 491 L1011 491 L1010 465 L1007 465 Z','M1032 476 L1042 473 L1042 496 L1033 496 Z M1048 471 L1054 469 L1058 495 L1047 495 Z']},
      {id:2,path:'M792 492 L931 492 L1074 498 L1077 518 L791 503 Z',holes:['M925 496 L996 497 L989 508 L917 505 Z','M1007 490 L1016 490 L1018 511 L1009 511 Z','M1033 492 L1061 494 L1060 505 L1032 502 Z']},
      {id:4,path:'M801 507 L827 507 L827 516 L801 516 Z M853 510 L886 510 L886 522 L853 522 Z M924 518 L957 518 L957 530 L924 530 Z M1006 523 L1045 523 L1045 535 L1006 535 Z'},
      {id:6,path:'M791 345 Q930 306 1074 304 L1073 426 L790 430 Z',holes:[]}
    ]
  },
  bath:{
    image:'assets/bath.webp',variants:['assets/bath-areia.webp','assets/bath-grafite.webp'],label:'Casa de banho',short:'Casa de banho',location:'Comum · 1.º andar',
    normal:{yaw:.2,pitch:-.1,fov:120},fixedFov:120,groups:['walls','shower','floor'],types:[3,3,5],light:[.82,.82,.72],defaults:{walls:'borba-white-wall',shower:'borba-white-wall',floor:'gaia-cinza-floor'},
    focus:{walls:{yaw:1.08,pitch:-.08,fov:76},shower:{yaw:.48,pitch:-.02,fov:67},floor:{yaw:.15,pitch:-.69,fov:76}},
    points:[{id:'walls',x:1260,y:575},{id:'shower',x:1069,y:437},{id:'floor',x:1038,y:731}],
    masks:[
      {id:1,path:'M377 263 Q456 205 545 195 L545 788 Q453 771 379 717 Z M546 194 Q589 203 629 293 L630 642 Q598 736 545 788 Z M665 377 Q745 389 833 386 L833 484 L665 488 Z M632 485 L904 476 L909 594 L835 641 L630 643 Z M1149 347 Q1225 103 1591 105 L1591 813 Q1297 813 1208 750 L1149 584 Z',holes:['M668 550 L697 549 Q696 529 719 528 L772 530 Q795 530 794 550 L835 566 L834 637 Q761 663 670 661 Z','M850 567 Q877 554 908 566 L929 581 Q928 609 913 619 L883 628 Q860 623 852 605 Z','M848 488 L875 485 L876 504 L850 510 Z','M731 499 L740 499 L740 518 L736 519 L735 509 L731 509 Z M750 499 L760 498 L760 513 L754 514 Z M779 492 L789 492 L789 506 L779 506 Z','M1261 471 L1284 467 L1286 481 L1262 482 Z M1328 479 L1356 478 L1357 493 L1327 494 Z']},
      {id:2,path:'M904 343 Q930 357 951 357 Q1040 345 1150 348 L1149 581 L1042 589 L907 572 Z M833 386 Q868 377 904 343 L904 481 L833 484 Z',holes:['M953 455 L1046 455 L1046 489 L953 483 Z','M886 453 L901 453 L901 477 L886 477 Z','M654 468 L664 468 L664 481 L654 481 Z']},
      // Follow the visible floor boundary, including beneath the glass and
      // suspended fixtures. Both panorama edges close at the door, not the nadir.
      {id:3,path:'M0 844 C75 826 119 778 131 718 Q238 734 346 712 L375 734 L383 733 C427 765 480 785 544 791 C584 752 614 698 630 644 L666 643 L666 658 C726 664 789 651 835 636 L835 621 L868 609 C879 614 888 620 898 619 C916 618 925 604 927 583 L950 568 Q1040 581 1149 580 C1150.83 584 1154.83 593.17 1160 604 C1165.17 614.83 1173.33 632.83 1180 645 C1186.67 657.17 1193.33 667.17 1200 677 C1206.67 686.83 1213.33 695.83 1220 704 C1226.67 712.17 1233.33 719.17 1240 726 C1246.67 732.83 1253.33 739.33 1260 745 C1266.67 750.67 1273.33 755.67 1280 760 C1286.67 764.33 1293.33 767.67 1300 771 C1306.67 774.33 1313.33 777.17 1320 780 C1326.67 782.83 1333.33 785.67 1340 788 C1346.67 790.33 1353.33 792 1360 794 C1366.67 796 1373.33 798.17 1380 800 C1386.67 801.83 1390 803.17 1400 805 C1410 806.83 1426.67 809.17 1440 811 C1453.33 812.83 1466.67 814.83 1480 816 C1493.33 817.17 1506.67 817.5 1520 818 C1533.33 818.5 1548.33 819 1560 819 C1571.67 819 1585 818.17 1590 818 L1592 857 C1669 869 1739 856 1774 846 L1774 887 L0 887 Z',holes:[]}
    ]
  }
};
