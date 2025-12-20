/**
 * Math Utils
 */
export const MathUtils = {
    isInsideSuperEllipse: (x, y, centerX, centerY, width, height, cornerRadius, exponent) => {
        const dx = x - centerX;
        const dy = y - centerY;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const edgeX = halfWidth - cornerRadius;
        const edgeY = halfHeight - cornerRadius;

        if (Math.abs(dx) <= edgeX && Math.abs(dy) <= edgeY) {
            return { inside: true, distance: 0 };
        }

        let cornerCenterX, cornerCenterY;

        if (dx > edgeX && dy > edgeY) {
            cornerCenterX = edgeX;
            cornerCenterY = edgeY;
        } else if (dx > edgeX && dy < -edgeY) {
            cornerCenterX = edgeX;
            cornerCenterY = -edgeY;
        } else if (dx < -edgeX && dy > edgeY) {
            cornerCenterX = -edgeX;
            cornerCenterY = edgeY;
        } else if (dx < -edgeX && dy < -edgeY) {
            cornerCenterX = -edgeX;
            cornerCenterY = -edgeY;
        } else {
            return { inside: true, distance: 0 };
        }

        const rx = dx - cornerCenterX;
        const ry = dy - cornerCenterY;
        const normalizedX = Math.abs(rx) / cornerRadius;
        const normalizedY = Math.abs(ry) / cornerRadius;

        // Avoid division by zero or negative base if possible, though Math.abs handles sign
        const value = Math.pow(normalizedX, exponent) + Math.pow(normalizedY, exponent);
        const distance = value - 1;

        return { inside: value <= 1, distance: distance };
    }
};
