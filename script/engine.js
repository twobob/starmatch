/* ********************************************************************************* */
/* *************************** IN MEMORIAM ************************************* */
/* ************************* Claudius Ptolemy ************************************* */
/* ********************************************************************************* */
// In lieu of copyright
// This method of analysis by summing related occurrences of signifiers I found
// in a work by an American woman astrologer whose name, and book title, I do
// not unfortunately recall, about 4 or 5 decades ago.
// Since it is a sensible and logical approach I have followed it here, with some
// modifications.
// Will 18, Jan. 2016.
// wj18@talktalk.net
//
// Credits:
// Program: twobob
// Engine: Will 18
// algorithm version: 6.1
/* ******************************************************************************* */
var rp = -1;	// ruling planet ( number )
// AspectValues a: Conjunction, Opposition, Trine, Square, Sextile, Semi-square, Semi-sextile
var a = [0,180,120,90,60,45,30];	// FIXED
// Aspect Factor af: Conjunction, Opposition, Trine, Square, Sextile, Semi-square, Semi-sextile
// values calculated as _reciprocals_ of:
// 1*sqrt(1), 2*sqrt(1), 3*sqrt(1), 2*sqrt(2), 3*sqrt(2), 2*sqrt(4), 3*sqrt(4)
var af = [1,0.5,0.3333,0.3536,0.2357,0.25,0.1667];	// FIXED
// Aspect Orb ao:  Conjunction, Opposition, Trine, Square, Sextile, Semi-square, Semi-sextile
/* aoIndex = 0 for default (offset into array): USER-EXTENSIBLE */
/* Note: aspect orb sets 3,4,5 from 'Astrotheme.com: natal, synastry, transit */
/* N.b. orbs traditionally have factors, applying to the planets not the aspects */
/* orbType: 0 = aspect orbs (modern), 1 = planet orbs (ancient) */
var orbType = 0;
/* planet orbs: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto */
/* the outer three are modern additions - no asc. or MC aspects considered*/
var po = [[15,12,7,7,7,9,9,5,5,5],[17,12.5,7,8,8,12,10,5,5,5]];
/* poIndex = 0, 1 (Lilly, al-Biruni) */
var poIndex = 0;
var ao = [[9,9,7,7,5,3,3],[9,9,9,9,6,2,3],[10.8,10.0,8.3,7.5,5.7,2.5,1.5],[10,8,6,6,4.5,1,1],[2.6,2.5,2.3,2.3,1.3,1,1]];
var aoIndex = 0;
/* Traditional factors (ancient/modern): [signNum[ruler],[exaltation],[detriment],[fall]] */
/* tfIndex = 0 for ancient, 4 for modern, 8 for alternative modern (offset into array): USER-EXTENSIBLE */
/* Planet indices: Sun=0, Moon=1, Mercury=2, Venus=3, Mars=4, Jupiter=5, Saturn=6, Uranus=7, Neptune=8, Pluto=9 */
var tf = [
	// Ancient allocations (tfIndex 0-3)
	[4,3,2,1,0,2,3,4,5,6,6,5],[0,1,-1,5,-1,2,6,-1,-1,4,-1,3],[3,4,5,6,6,5,4,3,2,1,0,2],[6,-1,-1,4,-1,3,0,1,-1,5,-1,2],
	// Modern allocations (tfIndex 4-7) - corrected per ResearchOptions.txt
	[4,3,2,1,0,2,3,9,5,6,7,8],[0,9,-1,5,8,2,6,7,-1,4,-1,3],[3,9,5,6,7,8,4,3,2,1,0,2],[6,7,-1,4,-1,3,0,1,-1,5,8,2],
	// Alternative modern allocations (tfIndex 8-11) - added per ResearchOptions.txt
	[4,3,2,1,0,2,3,9,5,6,7,8],[0,1,-1,8,5,2,6,7,-1,4,9,3],[3,9,5,6,7,8,4,3,2,1,0,2],[6,7,-1,4,-1,3,0,1,-1,8,-1,2]
];	// USER-DEFINABLE but need to be defaulted for 'Reset/OtherRules'
var tfIndex = 0;
/* Traditional factors:  [signNum[polarity],[triplicity],[quadruplicity]] */
var ptq = [[1,0,1,0,1,0,1,0,1,0,1,0],[0,1,2,3,0,1,2,3,0,1,2,3],[0,1,2,0,1,2,0,1,2,0,1,2]];	// FIXED
/* Theme values ( t[n] in algorithm ) */
var theme = [0,0,0,0,0,0,0,0,0,0,0,0];	// INTERNAL
/* numAspects	[conjunction, opposition, trine, square, sextile, semi-square, semi-sextile] */
var numAspects = [0,0,0,0,0,0,0];	// number of aspect types. INTERNAL
/* numTradFactors [+ve, -ve, fire, earth, air, water, cardinal, fixed, mutable] */
var numTradFactors = [0,0,0,0,0,0,0,0,0];	// totals for traditional factors. INTERNAL
/* tfDominant: [polarity, triplicity, quadruplicity] - dominant pol., trip., quad. or -1 */
var tfDominant = [0,0,0];	// INTERNAL
/* planet strength [planetNum,...]  - arbitrary value for contribution to event occurrence */
var psRT = [1,1,1,1,1,1,1,1,1,1,1,1];	// INTERNAL
var precessionFlag = 0;	// true, precess position data before theme calculation
var precessedTheme = [0,0,0,0,0,0,0,0,0,0,0,0];
var nativityYear=0;	// KLUDGE - needs to supply birth year!
var nativity=0;	// Alias for nativityYear, used in precession calculations
var orbValue = 0;

	// Utility functions
	function isAspect(pos1,pos2,aspect,orb)
	{
		var diff = Math.abs(pos1-pos2);
		diff = ( diff > 180 ? 360-diff : diff );
		var value = Math.abs(diff-aspect);
		value = ( value > 180 ? 360 - value : value );
		var min = aspect-orb;
		var max = aspect+orb;
		max = ( max>360 ? max-360 : max );
		value = ( (min < diff ) && ( diff < max ) ? 1 : 0 );
		return value;
	}

	function aspectStrength(pos1,pos2,aspect,orb,factor)
	{	// -ve return is not-an-aspect
		var strength = 0;
		var pDiff = Math.abs ( pos1- pos2 );
		pDiff = ( pDiff > 180 ? 360 - pDiff : pDiff );
		strength = 1 - ( Math.abs ( pDiff - aspect ) / orb );
		// if not in [0, 1], reject, invalid
		strength = ( ( ( strength < 0 ) || ( strength > 1 ) ) ? -1 : strength*factor );
		return strength;
	}
	
	function signNum ( pos )
	{
		// Normalize position to 0-360 range
		var normalizedPos = pos % 360;
		if (normalizedPos < 0) normalizedPos += 360;
		
		value = normalizedPos/30-0.5
		value = ( value<0 ? 0 : value)
		value = Math.round( value )
		value = (value>=12 ? 11 : value)	// Should be 11 (Pisces), not -1
		return value
	}

	function house ( pos, ascendant )
	{
		var value = (pos - ascendant ) / 30-0.5;
		value = Math.round(value);
		value = ( value < 0 ? value + 12 : value );
		value = ( value > 12 ? value - 12 : value );
		return value+1;
	}

	// main algorithm
	function getThemeValues(Sun,Moon,Mercury,Venus,Mars,Jupiter,Saturn,Uranus,Neptune,Pluto,Ascendant,Midheaven)
	{
		// functions internal to getThemeValues()
		function numPlanetsInHouse ( houseNum )
		{
			numPlanets = 0;
			for ( n = 0; n < 10; n++ )
				if ( house ( planet[n], planet[10] ) == houseNum )
					numPlanets++;
			return numPlanets;
		}
		
		function numStrongPlanetsInHouse ( houseNum )
		{
			numStrong = 0;
			for ( n = 0; n < 10; n++ )
				if ( house ( planet[n], planet[10] ) == houseNum )	// planet n in house 1
				{
					if ( tf[tfIndex][signNum(planet[n])] == n )	// ruler?
						numStrong++;
					if ( tf[tfIndex+1][signNum(planet[n])] != -1 )
						if ( tf[tfIndex+1][signNum(planet[n])] == n )	// exalted?
							numStrong++;
				}
			return numStrong;
		}
		
		function numPlanetsInSign ( sign )
		{
			numPlanets = 0;
			for ( n = 0; n < 10; n++ )
				if ( signNum ( planet[n] ) == sign )
					numPlanets++;
			return numPlanets;
		}
		
		function numStrongPlanetsInSign ( sign )
		{
			numStrong = 0;
			for ( n = 0; n < 10; n++ )	// for all planets
			{
				if ( signNum ( planet[n] ) == sign )
				{
					if ( tf[tfIndex][sign] == n )	// ruler
						numStrong++;
					if ( tf[tfIndex+1][signNum(planet[n])] != -1 )
						if ( tf[tfIndex+1][sign] == n )	// exalted
							numStrong++;
				}
			}
			return numStrong;
		}
	
		function isMutualReception ( Px )
		{
			var signY = signNum(planet[Px]);
	
			if ( tf[tfIndex][signY] == Px )
				return -1;	// skip planet in own sign
			var signX;
			for ( m = 0; m < 10; m++ )
			{
				if ( tf[tfIndex][m] == Px )
				{
					signX = m;
					if ( signNum(planet[tf[tfIndex][signY]]) == signX )
						return signNum(planet[tf[tfIndex][signY]]);
				}
			}
			return -1;
		}
	
		/* Precession of equinoxes - shift of 1st. point of Aries (Ras Hammel still corresponds
		in the Hindu system of sidereal astrology) is now in Pisces.
		Does this make an astrological Aries (outside the sidereal system) a Pisces?
		Precession of equinoxes gives great circle of approx. 25772 years. First point of
		Aries defined in 130 BCE by Hipparchus.
		Current first point of Aries is thus 360*(currentYear+130)/25772, or about 0 Pisces.
		*/
		function precession ( year )
		{
			var elapsedYears;
			if ( year < 0 )
				elapsedYears = year-130;
			else
				elapsedYears = year+130;
			return 360*elapsedYears/25772;	// degrees precessed
		}
		
		function precessPositions ( nativityYear )
		{
			var degrees = precession (nativityYear );
			for ( n = 0; n < 12; n++ )
			{
				planet[n] -= degrees;
				planet[n] = ( planet[n] < 0 ? 360+planet[n] : planet[n] );
				planet[n] = ( planet[n] > 360 ? planet[n]-360 : planet[n] );
			}
		}

		function calculateThemeValue ( themeNum, signRuler, rulerWeighting )	// 1 - 12
		{
			var weighting = ( rulerWeighting == 0.5 ? 0.5 : 1 )	// alternate rulers
			// avoid adding contribution from non-ruler associations twice
			var themeValue, inMR;
			themeValue = 0;
	
			// i)  Are any of the following in House themeNum? 
			// ruler of sign themeNum-1, Sun, Moon, Ascendant ruler, a strong
			// planet, two or more planets  (allocate one point ( * weighting ) for each).
			if ( signRuler != -1 )	// check for sign ruler in House themeNum
			{	// is ruler in House?
				themeValue += ( house ( planet[signRuler], planet[10] ) == themeNum ? ps[signRuler]*rulerWeighting : 0 );
				// is the ruler in mutual reception?
				inMR = isMutualReception ( signRuler );
				if ( inMR != -1 )
				{	// effective conjunction affects theme of both planets involved
					themeValue += ps[signRuler];	// add a point - note: we do not consider aspect just sign
					theme[inMR] += ps[tf[0][inMR]];
				}
			}
			if ( themeNum != 5 )	// Sun in House themeNum (not Leo)?
				themeValue += ( house ( planet[0], planet[10] ) == themeNum ? ps[0]*weighting : 0 );
			if ( themeNum != 4 )	// // Moon in House themeNum (not Cancer)?
				themeValue += ( house ( planet[1], planet[10] ) == themeNum ? ps[1]*weighting : 0 );
			// Asc. ruler in House themeNum?
			if ( rp != - 1)
				themeValue += ( house ( planet[rp], planet[10] ) == themeNum ? ps[rp]*weighting : 0 );
			// any strong planets? Add extra point
			// it is  possible for more than 1 planet to be in exaltation, depending on
			// rules in tf[planetNum, 1]
			themeValue += ( numStrongPlanetsInHouse ( themeNum ) > 1 ? weighting : 0 );	// 1 point for each?
			// 2 or more planets in house 1?
			themeValue += ( numPlanetsInHouse ( themeNum ) > 1 ? weighting :  0 );

			// ii)  Are any of the following in sign themeNum?  Sign ruler, Sun, Moon, Ascendant
			// a strong planet, two or more planets?
			if ( signRuler != -1 )	// check for signRuler in sign
				themeValue += ( signNum ( planet[signRuler] ) == themeNum-1 ? ps[signRuler]*rulerWeighting : 0 );
			if ( themeNum != 5 )
				themeValue += ( signNum ( planet[0] ) == themeNum-1 ? ps[0]*weighting : 0 );
			if ( themeNum != 4 )
				themeValue += ( signNum ( planet[1] ) == themeNum-1 ? ps[1]*weighting : 0 );
			themeValue += ( signNum ( planet[10] ) == themeNum-1 ? weighting : 0 );
			// strong planets in sign include both rp and exalted
			themeValue += ( numStrongPlanetsInSign ( themeNum-1 ) > 0 ? weighting : 0 );
			// 2 or more planets in sign themeNum-1?
			themeValue += ( numPlanetsInSign ( themeNum-1 ) > 1 ? weighting : 0 );

			// iii) Check for: sign ruler aspecting the Sun, Moon, Ascendant (add
			// strength of the aspect).
			for ( n = 0; n < 7; n++ )	// aspect list
			{
				if ( themeNum != 5 )
				{
					if ( orbType == 0 )	// aspect orbs
						orbValue = ao[aoIndex][n];
					else
						orbValue = 0.5*(po[poIndex][0]+po[poIndex][signRuler]);	// half sum of planet orbs
					if ( isAspect ( planet[0], planet[signRuler], a[n], orbValue ) )	// signRuler/Sun aspect
						themeValue += ps[0]*ps[signRuler]*weighting * rulerWeighting * aspectStrength ( planet[0], planet[signRuler], a[n], orbValue, af[n] );
				}

				if ( themeNum != 4 )
				{
					if ( orbType == 0 )	// aspect orbs
						orbValue = ao[aoIndex][n];
					else
						orbValue = 0.5*(po[poIndex][1]+po[poIndex][signRuler]);
					if ( isAspect ( planet[1], planet[signRuler], a[n], ao[aoIndex][n] ) )	// signRuler/Moon aspect
						themeValue += ps[1]*ps[signRuler]*weighting * rulerWeighting * aspectStrength ( planet[1], planet[signRuler], a[n], orbValue, af[n] );
				}
				
				if ( isAspect ( planet[10], planet[signRuler], a[n], ao[aoIndex][n] ) )	// signRuler/Ascendant aspect
				{
					if ( orbType == 0 )	// aspect orbs
						orbValue = ao[aoIndex][n];
					else
						orbValue = po[poIndex][signRuler];	// we don't have a planet orb for asc.
					themeValue +=ps[signRuler]* weighting * aspectStrength ( planet[10], planet[signRuler], a[n], orbValue, af[n] );
				}
				
				if ( themeNum != 1 )	// don't consider MC in Aries?
				{
					if ( orbType == 0 )	// aspect orbs
						orbValue = ao[aoIndex][n];
					else
						orbValue = po[poIndex][signRuler];	// we don't have a planet orb for MC
					if ( isAspect ( planet[11], planet[signRuler], a[n], ao[aoIndex][n] ) )	// signRuler/Midheaven aspect
						themeValue += ps[signRuler]*weighting * aspectStrength ( planet[11], planet[signRuler], a[n], orbValue, af[n] );
				}

			}
			theme[themeNum-1] += themeValue;	// allow for multiple calls
		}
	
		// Create f prefixed usable values
		var fSun = TidyUpAndFloat(Sun);
		var fMoon = TidyUpAndFloat(Moon);
		var fMercury = TidyUpAndFloat(Mercury);
		var fVenus = TidyUpAndFloat(Venus);
		var fMars = TidyUpAndFloat(Mars);
		var fJupiter = TidyUpAndFloat(Jupiter);
		var fSaturn = TidyUpAndFloat(Saturn);
		var fUranus = TidyUpAndFloat(Uranus);
		var fNeptune = TidyUpAndFloat(Neptune);
		var fPluto = TidyUpAndFloat(Pluto);
		var fAscendant = TidyUpAndFloat(Ascendant);
		var fMidheaven = TidyUpAndFloat(Midheaven);
		var numPlanets = 0;
		var numStrong = 0;
		/* Planetary positions */
		var planet = [fSun,fMoon,fMercury,fVenus,fMars,fJupiter,fSaturn,fUranus,fNeptune,fPluto,fAscendant,fMidheaven];
	
		// algorithm main starts here
		var m,n,o;	// loop vars.
		var k,tmp;
		var ps = [0,0,0,0,0,0,0,0,0,0,0,0];
		// initialise theme array
		for ( n = 0; n < 12; n++ )
		{
			theme[n] = 0;
			ps[n] = psRT[n];		// reset to initialised values
		}
	
		if ( precessionFlag != 0 )
			precessPositions ( nativity );
	
		for ( n = 0; n< 9; n++ )
			numTradFactors[n] = 0;
		for ( n = 0; n< 3; n++ )
			tfDominant[n] = 0;
		for ( n = 0; n < 8; n++ )
			numAspects[n] = 0;
	
		// find number of polarities, triplicities, quadruplicities
		//-ve, +ve, fire, earth, air, water, card, fix, mut totals
		for ( n = 0; n <12; n++)	// for all planets, Asc., M.C.	
		{
			k = signNum ( planet[n] )
	
			if ( ptq[0][k] == 1 )	// can only be [0,1]
				numTradFactors[0]++;	// +ve sign
			else
				numTradFactors[1]++;	// -ve sign
	
			if ( ptq[1][k] == 0 )
				numTradFactors[2]++;	// fire
			if ( ptq[1][k] ==1 )
				numTradFactors[3]++;	// earth
			if ( ptq[1][k] == 2 )
				numTradFactors[4]++;	// air
			if ( ptq[1][k] == 3 )
				numTradFactors[5]++;	// water
			
			if ( ptq[2][k] == 0 )
				numTradFactors[6]++;	// cardinal
			if ( ptq[2][k] == 1 )
				numTradFactors[7]++;	// fixed
			if ( ptq[2][k] == 2 )
				numTradFactors[8]++;	// mutable
		}
		
	if ( numTradFactors[0] > numTradFactors[1] )	// polarity
		tfDominant[0] = 1;		// +ve dominant
	else
		tfDominant[0] = 0;		// -ve dominant

	tfDominant[1] = 2;		// default fire (index 2 in numTradFactors)

	for ( n = 3; n < 6; n++ )
		if ( numTradFactors[n] > numTradFactors[tfDominant[1]] )
			tfDominant[1] = n;

	for ( n = 3; n < 6; n++ )
		if ( n != tfDominant[1] )
			if ( numTradFactors[n] == numTradFactors[tfDominant[1]] )	// no dominant trip.
				tfDominant[1] = -1;	tfDominant[2] = 6;		// default cardinal (index 6 in numTradFactors)
	for ( n = 6; n < 9; n++ )
		if ( numTradFactors[n] > numTradFactors[tfDominant[2]] )
			tfDominant[2] = n;

	for ( n = 6; n < 9; n++ )
		if ( n != tfDominant[2] )
			if ( numTradFactors[n] == numTradFactors[tfDominant[2]] )	// no dominant quad.
				tfDominant[2] = -1;		// find number of each aspect
		// for each planet, then for each aspect, if aspect, add 1
		if ( orbType == 0)
		{
			for ( n = 0; n < 12; n++ )
				for ( m = n+1; m < 12; m++ )
					if ( n != m )
					{
						for ( o = 0; o < 7; o++ )	// aspect list
							if ( isAspect ( planet[n], planet[m], a[o], ao[aoIndex][o] ) )
								numAspects[o]++;
					}
	
		}
	else
	{
		for ( n = 0; n < 10; n++ )	// aspects between planets
			for ( m = n+1; m < 10; m++ )
				if ( n != m )
				{
					orbValue = 0.5*(po[poIndex][n]+po[poIndex][m]);
					for ( o = 0; o < 7; o++ )
						if ( isAspect ( planet[n], planet[m], a[o], orbValue ) )
							numAspects[o]++;
				}
		for ( n = 0; n < 10; n++ )	// aspects from planets to Asc. and M.C.
			for ( m = 10; m < 12; m++ )
			{
				orbValue = po[poIndex][n];
				for ( o = 0; o < 7; o++ )
					if ( isAspect ( planet[n], planet[m], a[o], orbValue ) )
						numAspects[o]++;
			}
	}

	// find dominant aspect (if any)
	tmp = 0;
	for ( n = 0; n < 7; n++ )
		if ( numAspects[n] > numAspects[tmp] )
			tmp = n;		for ( m = 0; m < 7; m++ )
			if ( m != tmp )
			{
				if ( numAspects[m] == tmp )	// no dominant aspect type
					tmp = -1;
			}
		dominantAspect = tmp;
	
		// check for debility/fall in planets and reduce contribution
		for ( n = 0 ; n < 10; n++ )	// not Ascendant or Midheaven
		{
			var sign = signNum ( planet[n] );
			
			if ( ( tf[3][sign] == n ) || ( tf[4][sign] == n ) )
				ps[n] = 0.5;	// reduce contribution
		}
	
		// Ascendant ruler ( chart ruler )
		rp = tf[tfIndex][signNum ( planet[10] )];
		// ##### end initialisation #####
		
		// Chart analysis - calculate theme values
		// n.b. signs are numbered [0,11], houses are [1,12]
	
		// ##### Theme 1 #####
		calculateThemeValue ( 1, tf[tfIndex][0],1 );
		// Is the chart emphasis on any of the following:  fire, cardinal, conjunctions?
		if ( tfDominant[1] == 0 )		// fire dominant?
			theme[0] += 1;
		if ( tfDominant[2] == 0 )		// cardinal dominant?
			theme[0] += 1;
		if ( dominantAspect == 0 )		// conjunctions dominant
			theme[0] += 1;
		// ##### end Theme 1 #####
	
		// ##### Theme 2 #####
		calculateThemeValue ( 2, tf[tfIndex][1], 1 );
		// Is the chart emphasis on any of the following:  earth, fixed
		if ( tfDominant[1] == 1 )		// earth dominant?
			theme[1] += 1;
		if ( tfDominant[2] == 1 )		// fixed dominant?
			theme[1] += 1;
		theme[1] = ( theme[1] > 3 ? theme[1]+1 : theme[1] );	// this requires max aspect strength!
		// ##### end Theme 2 #####
	
		// ##### Theme 3 #####
		calculateThemeValue ( 3, tf[tfIndex][2], 1 );
		// Is the chart emphasis on any of the following:  air, mutable, sextile
		if ( tfDominant[1] == 2 )		// air dominant?
			theme[2] += 1;
		if ( tfDominant[2] == 2 )		// mutable dominant?
			theme[2] += 1;
		if ( dominantAspect == 4 )		// sextiles dominant
			theme[2] += 1;
		// ##### end Theme 3 #####
	
		// ##### Theme 4 #####
		calculateThemeValue ( 4, tf[tfIndex][3], 2 );
		// Is the chart emphasis on water, cardinal, square aspects?
		if ( tfDominant[1] == 3 )		// water dominant?
			theme[3] += 1;
		if ( tfDominant[2] == 0 )		// cardinal dominant?
			theme[3] += 1;
		if ( dominantAspect == 3 )		// squares dominant
		theme[3] += 1;
		// ##### end Theme 4	#####
	
		// ##### Theme 5 #####
		calculateThemeValue ( 5, tf[tfIndex][4],2 );
		// Is the chart emphasis on fire, fixed, trine aspects?
		if ( tfDominant[1] == 0 )		// fire dominant?
			theme[4] += 1;
		if ( tfDominant[2] == 1 )		// fixed dominant?
			theme[4] += 1;
		if ( dominantAspect == 2 )		// trines dominant
			theme[4] += 1;
		// ##### end Theme 5	#####
	
		// ##### Theme 6 #####
		calculateThemeValue ( 6, tf[tfIndex][5], 1 );
		// Is the chart emphasis on earth, mutable?
		if ( tfDominant[1] == 1 )		// earth dominant?
			theme[5] += 1;
		if ( tfDominant[2] == 2 )		// mutable dominant?
			theme[5] += 1;
		theme[5] = ( theme[5] > 3 ? theme[5]+1 : theme[5] );
		// ##### end Theme 6	#####
	
		// ##### Theme 7 #####
		calculateThemeValue ( 7, tf[tfIndex][6], 1 );
		// Is the chart emphasis on any of the following:  air, cardinal,
		// oppositions?
		if ( tfDominant[1] == 2 )		// air dominant?
			theme[6] += 1;
		if ( tfDominant[2] == 0 )		// cardinal dominant?
			theme[6] += 1;
		if ( dominantAspect == 1 )		// oppositions dominant
			theme[6] += 1;
		// ##### end Theme 7 #####
	
		// ##### Theme 8 #####
		var ruler = tf[tfIndex][7];
		if ( ruler == 9 )	// Pluto, modern ruler of Scorpio
		{
			calculateThemeValue ( 8, ruler, 0.5 );
			calculateThemeValue ( 8, 4, 0.5 );	// add contribution from ancient ruler Mars
			// also check Mars/Pluto aspects
			if ( orbType == 0 )
			{
				for ( n = 0; n < 7; n++ )
				{
					if ( isAspect ( planet[4], planet[ruler], a[n], ao[aoIndex][n] ))	// signRuler/Mars aspect
						theme[7] += ps[4]*ps[ruler]*aspectStrength ( planet[4], planet[ruler], a[n], ao[aoIndex][n], af[n] );
				}
			}
			else
			{
				orbValue = 0.5*(po[poIndex][4]+po[poIndex][ruler]);
				if ( isAspect ( planet[4], planet[ruler], a[n], orbValue ))	// signRuler/Mars aspect
					theme[7] += ps[4]*ps[ruler]*aspectStrength ( planet[4], planet[ruler], a[n], orbValue, af[n] );
			}
		}
		else
			calculateThemeValue ( 8, ruler, 1 );	// just use ancient ruler Mars
	
		if ( tfDominant[1] == 3 )		// water dominant?
			theme[7] += 1;
		if ( tfDominant[2] == 1 )		// fixed dominant?
			theme[7] += 1;
		theme[7] = ( theme[7] > 3 ? theme[7]+1 : theme[7] );
		// ##### end Theme 8 #####
	
		// ##### Theme 9 #####
		calculateThemeValue ( 9, tf[tfIndex][8], 1 );
		// Is the chart emphasis on any of the following:  fire, mutable, trine aspects
		if ( tfDominant[1] == 0 )		// fire dominant?
			theme[8] += 1;
		if ( tfDominant[2] == 2 )		// mutable dominant?
			theme[8] += 1;
		if ( dominantAspect == 2 )		// trines dominant
			theme[8] += 1;
		// ##### end Theme 9 #####
	
		// ##### Theme 10 #####
		calculateThemeValue ( 10, tf[tfIndex][9], 1 );
		// Is the chart emphasis on any of the following:  fire, mutable, trine aspects
		if ( tfDominant[1] == 1 )		//  earth dominant?
			theme[9] += 1;
		if ( tfDominant[2] == 0 )		// cardinal dominant?
			theme[9] += 1;
		if ( dominantAspect == 3 )		// squares dominant
			theme[9] += 1;
		// ##### end Theme 10 #####
	
		// ##### Theme 11 #####
		var ruler = tf[tfIndex][10];
		if ( ruler == 7 )	// Uranus, modern ruler of Aquarius
		{
			calculateThemeValue ( 11, ruler, 0.5 );
			calculateThemeValue ( 11, 6, 0.5 );	// add contribution from ancient ruler Saturn
						// also check Saturn/Uranus aspects
			if ( orbType == 0 )
			{
				for ( n = 0; n < 7; n++ )
				{
					if ( isAspect ( planet[6], planet[ruler], a[n], ao[aoIndex][n] ))	// signRuler/Mars aspect
						theme[10] += ps[6]*ps[ruler]*aspectStrength ( planet[6], planet[ruler], a[n], ao[aoIndex][n], af[n] );
				}
			}
			else
			{
				orbValue = 0.5*(po[poIndex][6]+po[poIndex][ruler]);
				if ( isAspect ( planet[6], planet[ruler], a[n], orbValue ))	// signRuler/Mars aspect
					theme[10] += ps[6]*ps[ruler]*aspectStrength ( planet[6], planet[ruler], a[n], orbValue, af[n] );
			}
		}
		else
			calculateThemeValue ( 11, ruler, 1 );	// just use ancient ruler Saturn
		// Is the chart emphasis on air, fixed, sextile aspects?
		if ( tfDominant[1] == 2 )		// air dominant?
			theme[10] += 1;
		if ( tfDominant[2] == 1 )		// fixed dominant?
			theme[10] += 1;
		if ( dominantAspect == 4 )		// sextiles dominant
			theme[10] += 1;
		// ##### end Theme 11 #####
	
		// ##### Theme 12 #####
		var ruler = tf[tfIndex][11];
		if ( ruler == 8 )	// Neptune, modern ruler of Pisces
		{
			calculateThemeValue ( 12, ruler, 0.5 );
			calculateThemeValue ( 12, 5, 0.5 );	// add contribution from ancient ruler Jupiter
			// also check Jupiter/Neptune aspects
			if ( orbType == 0 )
			{
				for ( n = 0; n < 7; n++ )
				{
					if ( isAspect ( planet[5], planet[ruler], a[n], ao[aoIndex][n] ))	// signRuler/Mars aspect
						theme[11] += ps[5]*ps[ruler]*aspectStrength ( planet[6], planet[ruler], a[n], ao[aoIndex][n], af[n] );
				}
			}
			else
			{
				orbValue = 0.5*(po[poIndex][5]+po[poIndex][ruler]);
				if ( isAspect ( planet[5], planet[ruler], a[n], orbValue ))	// signRuler/Mars aspect
					theme[11] += ps[5]*ps[ruler]*aspectStrength ( planet[5], planet[ruler], a[n], orbValue, af[n] );
			}

		}
		else
			calculateThemeValue ( 12, ruler, 1 );	// just use ancient ruler Saturn
		// Is the chart emphasis on water, mutable?
		if ( tfDominant[1] == 3 )		// water dominant?
			theme[11] += 1;
		if ( tfDominant[2] == 2 )		// mutable dominant?
			theme[11] += 1;
		theme[11] = ( theme[11] > 3 ? theme[11]+1 : theme[11] );
		// ##### end Theme 12 #####
	
		// add balance of polarities to each theme, 1 extra point distributed over
		// relevant themes
		if ( tfDominant[0] == 1 )
		{
			n = 0;
			while ( n < 12 )
			{
				theme[n] += 1/12;
				n += 2;
			}
		}
		else
		{
			n = 1;
			while ( n < 12 )
			{
				theme[n] += 1/12;
				n += 2;
			}
		}
		
		if ( precessionFlag  != 0 )
		{	// the First Point of Aries is not well-defined
			m = Math.round(precession ( nativity ) / 360  + 0.5 ); 	// also flaky
			for ( n = 0; n < 12; n++ )
			{
				k = ( n-m < 0 ? 12-m : n-m );
				precessedTheme[k] = theme[n];
			}
		}

		var themeMax = 0;
		var totalStrength = 0;
		for ( n = 0; n < 12; n++ )
		{
			if ( theme[n] > themeMax )
				themeMax = theme[n];
			totalStrength += theme[n];
		}
		for ( n = 0; n < 12; n++ )
			theme[n] /= themeMax;
	}
	
	var rank = [[1,2,3,4,5,6,7,8,9,10,11,12],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]];

	function xProfile ( sArrayT, tArrayT )
	{
		// 1) Arrange sArrayT groups in descending order of magnitude
		tmp = 0;
		for ( m = 0; m < 11; m++)
			for ( n = 0; n < 11; n++ )
				if ( sArrayT[1][n+1] > sArrayT[1][n] )
				{
					tmp = sArrayT[1][n];
					sArrayT[1][n] = sArrayT[1][n+1];
					sArrayT[1][n+1] = tmp;
					tmp = sArrayT[0][n];
					sArrayT[0][n] = sArrayT[0][n+1];
					sArrayT[0][n+1] = tmp;
				}
				
		// 2) Arrange tArrayT groups in ascending order of magnitude
		tmp = 0;
		for ( m = 0; m < 11; m++)
			for ( n = 0; n < 11; n++ )
				if ( tArrayT[1][n+1] < tArrayT[1][n] )
				{
					tmp = tArrayT[1][n];
					tArrayT[1][n] = tArrayT[1][n+1];
					tArrayT[1][n+1] = tmp;
					tmp = tArrayT[0][n];
					tArrayT[0][n] = tArrayT[0][n+1];
					tArrayT[0][n+1] = tmp;
				}
			
		// 3) Find ranking correspondence between groups
		// correspondence[[rank][order][group]
		for ( n = 0; n < 12; n++ )
			for ( m = 0; m < 12; m++ )
				if ( sArrayT[0][m] == tArrayT[0][n] )
				{
					rank[1][m] = Math.abs ( n - m );
					rank[2][m] = sArrayT[0][m]+1;
				}

		// 4) Use the rank displacement (order ) to find fit
		var fit = 0;
		var rankValue;
		var rankScale;
		for ( n = 0; n < 6; n++ )
		{
			rankValue = -rank[1][n];
			rankScale = Math.pow ( 2, (1-rank[0][n] ) );
			rankValue = Math.exp(rankValue ) * rankScale;
			fit += rankValue
		}

		for ( n = 6; n < 12; n++ )
		{
			rankValue = -rank[1][n];
			rankScale = Math.pow ( 2, (1- ( 13-rank[0][n] ) ) );
			rankValue = Math.exp(rankValue) * rankScale;
			fit -= rankValue;
		}
		fit /= 1.96875;	// scale to max. value if all displacements are 0
		return fit;
	}


// END OF ENGINE
