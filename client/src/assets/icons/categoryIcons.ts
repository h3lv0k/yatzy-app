import { ScoreCategory } from '../../types/game';

import onesIcon          from './1.png';
import twosIcon          from './2.png';
import threesIcon        from './3.png';
import foursIcon         from './4.png';
import fivesIcon         from './5.png';
import sixesIcon         from './6.png';
import threeOfAKindIcon  from './3x.png';
import fourOfAKindIcon   from './4x.png';
import yatzyIcon         from './6x.png';
import smallStraightIcon from './smallstreet.png';
import largeStraightIcon from './largestreet.png';
import chanceIcon        from './chance.png';
import fullHouseIcon     from './fullhouse.png';

export const categoryIcons: Partial<Record<ScoreCategory, string>> = {
  ones:          onesIcon,
  twos:          twosIcon,
  threes:        threesIcon,
  fours:         foursIcon,
  fives:         fivesIcon,
  sixes:         sixesIcon,
  threeOfAKind:  threeOfAKindIcon,
  fourOfAKind:   fourOfAKindIcon,
  fullHouse:     fullHouseIcon,
  yatzy:         yatzyIcon,
  smallStraight: smallStraightIcon,
  largeStraight: largeStraightIcon,
  chance:        chanceIcon,
};
