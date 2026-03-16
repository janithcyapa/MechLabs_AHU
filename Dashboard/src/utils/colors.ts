export const getTempColor = (t: number) => {
    if (t < 18) return 'text-blue-400 ';
    if (t > 25) return 'text-amber-400';
    if (t > 30) return 'text-red-400';
    return 'text-green-400';
  };

export const getHumColor = (h: number) => {
    if (h > 70) return 'text-cyan-400';
    if (h < 40) return 'text-orange-400';
    return 'text-teal-400';
  };

export const getCo2Color = (c: number) => {
    if (c > 1000) return 'text-yellow-400 ';
    if (c < 800) return 'text-green-400 ';
    return 'text-amber-500 ';
  };
  
export const getPressureColor = (p: number) => {
    return 'text-purple-400'; 
  };