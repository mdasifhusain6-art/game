import bpy
import math
import os

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in bpy.data.collections:
        bpy.data.collections.remove(c)

def create_mat(name, color, rough=0.2, metal=0.0, emit_col=None, emit_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get("Principled BSDF")
    if "Base Color" in b.inputs:
        b.inputs["Base Color"].default_value = color
    if "Roughness" in b.inputs:
        b.inputs["Roughness"].default_value = rough
    if "Metallic" in b.inputs:
        b.inputs["Metallic"].default_value = metal
    if emit_col:
        if "Emission Color" in b.inputs:
            b.inputs["Emission Color"].default_value = emit_col
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = emit_strength
    return mat

def export_glb(filepath):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"Exported: {filepath}")

# ========================================================
# 1. FUTURISTIC CYBERCAR (High-speed Supercar)
# ========================================================
def build_cyber_car(assets_dir):
    clean()
    m_body = create_mat("CarBody", (0.04, 0.05, 0.08, 1.0), rough=0.15, metal=0.85)
    m_glass = create_mat("CarGlass", (0.0, 0.9, 1.0, 1.0), rough=0.05, emit_col=(0.0, 0.9, 1.0, 1.0), emit_strength=4.0)
    m_neon_pink = create_mat("NeonPink", (1.0, 0.0, 0.5, 1.0), rough=0.1, emit_col=(1.0, 0.0, 0.5, 1.0), emit_strength=8.0)
    m_neon_cyan = create_mat("NeonCyan", (0.0, 0.9, 1.0, 1.0), rough=0.1, emit_col=(0.0, 0.9, 1.0, 1.0), emit_strength=8.0)
    m_wheel = create_mat("CarWheel", (0.02, 0.02, 0.03, 1.0), rough=0.4, metal=0.7)

    # 1. Lower Chassis
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.35))
    chassis = bpy.context.active_object
    chassis.scale = (1.2, 2.4, 0.35)
    chassis.data.materials.append(m_body)
    bpy.ops.object.shade_smooth()

    # 2. Sleek Cockpit Cabin
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.15, 0.65))
    cabin = bpy.context.active_object
    cabin.scale = (0.85, 1.2, 0.38)
    cabin.data.materials.append(m_glass)
    bpy.ops.object.shade_smooth()

    # 3. Aerodynamic Front Hood & Splitter
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.25, 0.25), rotation=(math.radians(12), 0, 0))
    hood = bpy.context.active_object
    hood.scale = (1.15, 0.8, 0.18)
    hood.data.materials.append(m_body)

    # Headlight Strip (Neon Cyan)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.62, 0.28))
    headlight = bpy.context.active_object
    headlight.scale = (1.1, 0.06, 0.08)
    headlight.data.materials.append(m_neon_cyan)

    # 4. Rear Spoiler & Diffuser
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -1.35, 0.82))
    wing = bpy.context.active_object
    wing.scale = (1.35, 0.3, 0.06)
    wing.data.materials.append(m_neon_pink)

    # Spoiler struts
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 0.7, -1.3, 0.6))
        strut = bpy.context.active_object
        strut.scale = (0.06, 0.15, 0.38)
        strut.data.materials.append(m_body)

    # 5. Glowing Neon Exhausts
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.2, vertices=16, location=(sign * 0.45, -1.25, 0.3), rotation=(math.radians(90), 0, 0))
        exh = bpy.context.active_object
        exh.data.materials.append(m_neon_pink)

    # 6. Four Glowing Cyber Wheels
    wheel_positions = [
        (-1.22, 0.9, 0.35),
        (1.22, 0.9, 0.35),
        (-1.25, -0.9, 0.38),
        (1.25, -0.9, 0.38)
    ]
    for pos in wheel_positions:
        # Wheel tire
        bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.24, vertices=24, location=pos, rotation=(0, math.radians(90), 0))
        w = bpy.context.active_object
        w.data.materials.append(m_wheel)
        bpy.ops.object.shade_smooth()

        # Wheel rim glow ring
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.04, location=pos, rotation=(0, math.radians(90), 0))
        rim = bpy.context.active_object
        rim.data.materials.append(m_neon_cyan)

    export_glb(os.path.join(assets_dir, "vehicle_car.glb"))

# ========================================================
# 2. FUTURISTIC CYBERBIKE (Tron Lightcycle Style)
# ========================================================
def build_cyber_bike(assets_dir):
    clean()
    m_body = create_mat("BikeBody", (0.05, 0.06, 0.08, 1.0), rough=0.2, metal=0.9)
    m_neon_lime = create_mat("NeonLime", (0.1, 1.0, 0.3, 1.0), rough=0.1, emit_col=(0.1, 1.0, 0.3, 1.0), emit_strength=10.0)
    m_neon_cyan = create_mat("NeonCyan", (0.0, 0.95, 1.0, 1.0), rough=0.1, emit_col=(0.0, 0.95, 1.0, 1.0), emit_strength=8.0)
    m_glass = create_mat("BikeGlass", (0.1, 0.15, 0.2, 1.0), rough=0.1, emit_col=(0.1, 1.0, 0.5, 1.0), emit_strength=3.0)

    # 1. Main Curved Bike Body (Elongated Chibi-Aero Streamliner)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.55))
    chassis = bpy.context.active_object
    chassis.scale = (0.55, 2.0, 0.55)
    chassis.data.materials.append(m_body)
    bpy.ops.object.shade_smooth()

    # 2. Windshield / Rider Shell
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, location=(0, 0.25, 0.85))
    shell = bpy.context.active_object
    shell.scale = (0.55, 1.3, 0.45)
    shell.data.materials.append(m_glass)
    bpy.ops.object.shade_smooth()

    # 3. Giant Front Wheel (Hubless glowing light ring)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.14, location=(0, 1.25, 0.52), rotation=(0, math.radians(90), 0))
    front_wheel = bpy.context.active_object
    front_wheel.data.materials.append(m_neon_lime)
    bpy.ops.object.shade_smooth()

    # Front wheel center core
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.22, vertices=20, location=(0, 1.25, 0.52), rotation=(0, math.radians(90), 0))
    fw_core = bpy.context.active_object
    fw_core.data.materials.append(m_body)

    # 4. Giant Rear Wheel (Dual thruster drive)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.55, minor_radius=0.16, location=(0, -1.25, 0.55), rotation=(0, math.radians(90), 0))
    rear_wheel = bpy.context.active_object
    rear_wheel.data.materials.append(m_neon_lime)
    bpy.ops.object.shade_smooth()

    # Rear wheel center core
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=0.25, vertices=20, location=(0, -1.25, 0.55), rotation=(0, math.radians(90), 0))
    rw_core = bpy.context.active_object
    rw_core.data.materials.append(m_body)

    # 5. Neon Light Ribbons along chassis
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 0.3, 0, 0.62))
        ribbon = bpy.context.active_object
        ribbon.scale = (0.04, 1.8, 0.08)
        ribbon.data.materials.append(m_neon_lime)

    # 6. Twin High-velocity Plasma Thrusters
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.35, vertices=16, location=(sign * 0.22, -1.05, 0.72), rotation=(math.radians(90), 0, 0))
        jet = bpy.context.active_object
        jet.data.materials.append(m_neon_cyan)

    export_glb(os.path.join(assets_dir, "vehicle_bike.glb"))

# ========================================================
# 3. BOOST RAMP (Launches vehicles with Super Speed!)
# ========================================================
def build_boost_ramp(assets_dir):
    clean()
    m_metal = create_mat("RampMetal", (0.08, 0.1, 0.15, 1.0), rough=0.25, metal=0.9)
    m_neon_gold = create_mat("NeonGold", (1.0, 0.8, 0.0, 1.0), rough=0.1, emit_col=(1.0, 0.8, 0.0, 1.0), emit_strength=10.0)

    # Slanted Ramp Base
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.35), rotation=(math.radians(-16), 0, 0))
    ramp = bpy.context.active_object
    ramp.scale = (2.6, 2.8, 0.3)
    ramp.data.materials.append(m_metal)

    # Glowing Chevron Arrows (>>>)
    for i in [-0.6, 0.0, 0.6]:
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.6, depth=0.15, location=(0, i, 0.42 + i * 0.2), rotation=(math.radians(-16), 0, math.radians(180)))
        arrow = bpy.context.active_object
        arrow.scale = (1.4, 0.45, 1.0)
        arrow.data.materials.append(m_neon_gold)

    export_glb(os.path.join(assets_dir, "boost_ramp.glb"))

# ========================================================
# 4. PORTAL GATE (Warp Gate for Level Clear!)
# ========================================================
def build_portal_gate(assets_dir):
    clean()
    m_frame = create_mat("GateFrame", (0.06, 0.08, 0.12, 1.0), rough=0.2, metal=0.9)
    m_warp = create_mat("WarpVortex", (0.5, 0.0, 1.0, 1.0), rough=0.05, emit_col=(0.6, 0.1, 1.0, 1.0), emit_strength=12.0)
    m_gold = create_mat("GateGold", (1.0, 0.85, 0.2, 1.0), rough=0.1, emit_col=(1.0, 0.85, 0.2, 1.0), emit_strength=8.0)

    # Massive Octagonal Portal Ring
    bpy.ops.mesh.primitive_torus_add(major_radius=4.8, minor_radius=0.55, location=(0, 0, 4.0), rotation=(math.radians(90), 0, 0))
    ring = bpy.context.active_object
    ring.data.materials.append(m_frame)
    bpy.ops.object.shade_smooth()

    # Inner Swirling Event Horizon Rim
    bpy.ops.mesh.primitive_torus_add(major_radius=4.4, minor_radius=0.18, location=(0, 0, 4.0), rotation=(math.radians(90), 0, 0))
    inner_ring = bpy.context.active_object
    inner_ring.data.materials.append(m_warp)

    # Portal Generators (4 corners)
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        x = 4.8 * math.cos(rad)
        z = 4.0 + 4.8 * math.sin(rad)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=1.2, location=(x, 0, z), rotation=(math.radians(90), 0, 0))
        gen = bpy.context.active_object
        gen.data.materials.append(m_gold)

    export_glb(os.path.join(assets_dir, "portal_gate.glb"))

# ========================================================
# 5. CYBER CITY SKYSCRAPER (Highway Background Decor)
# ========================================================
def build_skyscraper(assets_dir):
    clean()
    m_bldg = create_mat("BldgMat", (0.03, 0.04, 0.07, 1.0), rough=0.3, metal=0.7)
    m_cyan_win = create_mat("CyanWindows", (0.0, 0.8, 1.0, 1.0), rough=0.1, emit_col=(0.0, 0.8, 1.0, 1.0), emit_strength=6.0)
    m_pink_win = create_mat("PinkWindows", (1.0, 0.1, 0.6, 1.0), rough=0.1, emit_col=(1.0, 0.1, 0.6, 1.0), emit_strength=6.0)

    # Main Tower
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 15.0))
    bldg = bpy.context.active_object
    bldg.scale = (6.0, 8.0, 30.0)
    bldg.data.materials.append(m_bldg)

    # Glowing Vertical Window Strips
    for y_offset in [-2.5, 0, 2.5]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.02, y_offset, 15.0))
        strip = bpy.context.active_object
        strip.scale = (0.06, 1.2, 26.0)
        strip.data.materials.append(m_cyan_win if y_offset == 0 else m_pink_win)

    # Rooftop Communications Spire
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=8.0, vertices=12, location=(0, 0, 33.0))
    spire = bpy.context.active_object
    spire.data.materials.append(m_pink_win)

    export_glb(os.path.join(assets_dir, "env_skyscraper.glb"))

def main():
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    os.makedirs(assets_dir, exist_ok=True)
    print(">>> Generating Futuristic Vehicles & Game World Assets in Blender 5.2...")
    build_cyber_car(assets_dir)
    build_cyber_bike(assets_dir)
    build_boost_ramp(assets_dir)
    build_portal_gate(assets_dir)
    build_skyscraper(assets_dir)
    print(">>> All Futuristic 3D Assets Generated Successfully!")

if __name__ == "__main__":
    main()
