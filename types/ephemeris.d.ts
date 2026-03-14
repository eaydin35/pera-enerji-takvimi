declare module 'ephemeris' {
    const ephemeris: {
        getAllPlanets: (date: Date, longitude: number, latitude: number, altitude: number) => any;
    };
    export default ephemeris;
}
