export type Polygon = {
    color: string;
    highlighted: boolean;
    id: string;
    points: { x: number, y: number }[];
}

export function createSelectionController(polygons: Polygon[], setPolygons: (p: Polygon[]) => void) {
    let selectedId: string | null = null;

    return function handleSelection(clickedId: string | null) {
        if (selectedId === null) {
            selectedId = clickedId;
            setPolygons(polygons.map((poly: Polygon) =>
                poly.id === clickedId
                    ? { ...poly, highlighted: true }
                    : poly
            ));
            return;
        }

        if (selectedId === clickedId) {
            selectedId = null;
            setPolygons(polygons.map((poly: Polygon) => ({ ...poly, highlighted: false })));
            return;
        }

        // swap colors
        setPolygons(polygons.map((poly: Polygon) => {
            return { ...poly, highlighted: false };
        }));

        selectedId = null;
    }
}
