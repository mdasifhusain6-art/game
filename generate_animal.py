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
# 3D CYBER MECHA ANIMAL (Cyber Panther / Robo-Cheetah)
# ========================================================
def build_cyber_animal(assets_dir):
    clean()
    m_armor = create_mat("AnimalArmor", (0.04, 0.05, 0.08, 1.0), rough=0.18, metal=0.88)
    m_gold_accent = create_mat("AnimalGold", (1.0, 0.82, 0.1, 1.0), rough=0.2, metal=0.95)
    m_neon_cyan = create_mat("AnimalCyan", (0.0, 0.95, 1.0, 1.0), rough=0.08, emit_col=(0.0, 0.95, 1.0, 1.0), emit_strength=9.0)
    m_neon_eye = create_mat("AnimalEyes", (1.0, 0.0, 0.45, 1.0), rough=0.05, emit_col=(1.0, 0.0, 0.45, 1.0), emit_strength=12.0)
    m_joints = create_mat("AnimalJoints", (0.12, 0.14, 0.18, 1.0), rough=0.3, metal=0.7)

    root = bpy.data.objects.new("Animal_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Main Athletic Torso / Chest (Sleek Predator Anatomy)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.2, 0.65))
    chest = bpy.context.active_object
    chest.name = "Chest"
    chest.scale = (0.75, 1.1, 0.58)
    chest.data.materials.append(m_armor)
    bpy.ops.object.shade_smooth()

    # Rear Hips
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.7, 0.62))
    hips = bpy.context.active_object
    hips.name = "Hips"
    hips.scale = (0.65, 0.85, 0.5)
    hips.data.materials.append(m_armor)
    bpy.ops.object.shade_smooth()

    # Spine Core (Glowing Neon Line)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 0.96))
    spine = bpy.context.active_object
    spine.scale = (0.1, 1.8, 0.08)
    spine.data.materials.append(m_neon_cyan)

    # 2. Cyber Predator Head & Jaws
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.15, 0.88), rotation=(math.radians(-12), 0, 0))
    head = bpy.context.active_object
    head.name = "Head"
    head.scale = (0.5, 0.65, 0.42)
    head.data.materials.append(m_armor)
    bpy.ops.object.shade_smooth()

    # Muzzle / Snout
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.55, 0.78), rotation=(math.radians(-8), 0, 0))
    snout = bpy.context.active_object
    snout.scale = (0.35, 0.45, 0.28)
    snout.data.materials.append(m_armor)
    bpy.ops.object.shade_smooth()

    # Glowing Cyber Eyes (Sharp angled slits)
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 0.26, 1.35, 0.96), rotation=(0, math.radians(sign * 25), math.radians(sign * 15)))
        eye = bpy.context.active_object
        eye.scale = (0.05, 0.22, 0.06)
        eye.data.materials.append(m_neon_eye)

    # Pointed Cyber Ears
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.18, depth=0.45, location=(sign * 0.28, 1.0, 1.18), rotation=(math.radians(-25), math.radians(sign * 15), 0))
        ear = bpy.context.active_object
        ear.scale = (0.5, 0.6, 1.0)
        ear.data.materials.append(m_gold_accent)

    # 3. Four Articulated Cyber Legs & Paws
    leg_coords = [
        ("Front_L", -0.48, 0.65, 0.42, 1),
        ("Front_R", 0.48, 0.65, 0.42, -1),
        ("Rear_L", -0.45, -0.65, 0.38, 1),
        ("Rear_R", 0.45, -0.65, 0.38, -1),
    ]

    for name, lx, ly, lz, side in leg_coords:
        # Shoulder / Hip Joint
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(lx, ly, lz + 0.2))
        joint = bpy.context.active_object
        joint.data.materials.append(m_joints)

        # Upper Leg
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.45, vertices=16, location=(lx, ly + 0.05, lz), rotation=(math.radians(15), 0, 0))
        upper = bpy.context.active_object
        upper.data.materials.append(m_armor)

        # Lower Leg / Kinetic Piston
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.42, vertices=16, location=(lx, ly - 0.08, lz - 0.32), rotation=(math.radians(-20), 0, 0))
        lower = bpy.context.active_object
        lower.data.materials.append(m_joints)

        # Glowing Paw / Claws
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly + 0.05, 0.08))
        paw = bpy.context.active_object
        paw.scale = (0.24, 0.38, 0.14)
        paw.data.materials.append(m_armor)

        # Paw Pad Neon Glow
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly + 0.05, 0.02))
        pad = bpy.context.active_object
        pad.scale = (0.2, 0.32, 0.04)
        pad.data.materials.append(m_neon_cyan)

    # 4. Twin High-Velocity Rocket Boosters on Back (Allows 200 km/h Highway Run!)
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.7, vertices=16, location=(sign * 0.38, -0.35, 1.0), rotation=(math.radians(85), 0, 0))
        thruster = bpy.context.active_object
        thruster.data.materials.append(m_gold_accent)

        # Thruster Flame Exhaust Ring
        bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.035, location=(sign * 0.38, -0.72, 0.97), rotation=(math.radians(85), 0, 0))
        flame = bpy.context.active_object
        flame.data.materials.append(m_neon_cyan)

    # 5. Articulated Cyber Tail
    tail_segments = 5
    for i in range(tail_segments):
        t_frac = i / tail_segments
        tz = 0.75 + math.sin(t_frac * 2.0) * 0.35
        ty = -1.0 - i * 0.28
        bpy.ops.mesh.primitive_cylinder_add(radius=0.07 - i * 0.008, depth=0.3, vertices=12, location=(0, ty, tz), rotation=(math.radians(-35), 0, 0))
        tail_seg = bpy.context.active_object
        tail_seg.data.materials.append(m_armor if i < tail_segments - 1 else m_neon_cyan)

    export_glb(os.path.join(assets_dir, "vehicle_animal.glb"))

def main():
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    print(">>> Building 3D Cyber Mecha Panther in Blender 5.2...")
    build_cyber_animal(assets_dir)
    print(">>> Cyber Animal 3D Model Baked Successfully!")

if __name__ == "__main__":
    main()
